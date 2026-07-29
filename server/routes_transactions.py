from datetime import date, datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from auth import AuthenticatedUser, get_current_supabase_user
from database import get_supabase_client

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionType(str, Enum):
    expense = "expense"
    income = "income"


class TransactionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_id: UUID | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    transaction_type: TransactionType = TransactionType.expense
    transaction_date: date = Field(default_factory=date.today)
    note: str | None = Field(default=None, max_length=1000)
    merchant: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def normalize_signed_amount(self):
        if self.amount == 0:
            raise ValueError("Amount cannot be zero")
        if self.amount < 0:
            self.amount = abs(self.amount)
            self.transaction_type = TransactionType.expense
        return self

    @field_validator("transaction_date")
    @classmethod
    def reject_future_date(cls, value: date) -> date:
        if value > datetime.now(timezone.utc).date():
            raise ValueError("Transaction date cannot be in the future")
        return value


class TransactionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_id: UUID | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    amount: Decimal | None = Field(default=None, max_digits=12, decimal_places=2)
    transaction_type: TransactionType | None = None
    transaction_date: date | None = None
    note: str | None = Field(default=None, max_length=1000)
    merchant: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def normalize_signed_amount(self):
        if self.amount == 0:
            raise ValueError("Amount cannot be zero")
        if self.amount is not None and self.amount < 0:
            self.amount = abs(self.amount)
            self.transaction_type = TransactionType.expense
        return self

    @field_validator("transaction_date")
    @classmethod
    def reject_future_date(cls, value: date | None) -> date | None:
        if value is not None and value > datetime.now(timezone.utc).date():
            raise ValueError("Transaction date cannot be in the future")
        return value


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    category_id: UUID | None = None
    category: str | None = None
    amount: Decimal
    transaction_type: TransactionType
    transaction_date: date
    note: str | None = None
    merchant: str | None = None
    created_at: datetime
    updated_at: datetime


def _not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Transaction not found")


def _resolve_category_id(client, user_id: str, category: str) -> str:
    result = (
        client.table("categories")
        .select("id")
        .eq("user_id", user_id)
        .eq("name", category.strip())
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=422, detail="Unknown category")
    return result.data[0]["id"]


def _format_transaction(row: dict) -> dict:
    formatted = dict(row)
    category = formatted.pop("categories", None)
    if isinstance(category, dict):
        formatted["category"] = category.get("name")
    return formatted


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: TransactionCreate,
    user: Annotated[AuthenticatedUser, Depends(get_current_supabase_user)],
):
    client = get_supabase_client(user.access_token)
    payload = transaction.model_dump(mode="json", exclude={"category"})
    if transaction.category:
        if transaction.category_id:
            raise HTTPException(status_code=422, detail="Use category or category_id, not both")
        payload["category_id"] = _resolve_category_id(client, user.id, transaction.category)
    payload["user_id"] = user.id
    result = client.table("transactions").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Transaction could not be created")
    row = result.data[0]
    if transaction.category:
        row = {**row, "category": transaction.category.strip()}
    return row


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    user: Annotated[AuthenticatedUser, Depends(get_current_supabase_user)],
):
    result = (
        get_supabase_client(user.access_token)
        .table("transactions")
        .select("*, categories(name)")
        .eq("user_id", user.id)
        .order("transaction_date", desc=True)
        .execute()
    )
    return [_format_transaction(row) for row in (result.data or [])]


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: UUID,
    user: Annotated[AuthenticatedUser, Depends(get_current_supabase_user)],
):
    result = (
        get_supabase_client(user.access_token)
        .table("transactions")
        .select("*, categories(name)")
        .eq("id", str(transaction_id))
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise _not_found()
    return _format_transaction(result.data[0])


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: UUID,
    transaction: TransactionUpdate,
    user: Annotated[AuthenticatedUser, Depends(get_current_supabase_user)],
):
    client = get_supabase_client(user.access_token)
    payload = transaction.model_dump(mode="json", exclude_unset=True, exclude={"category"})
    if transaction.category is not None:
        if transaction.category_id is not None:
            raise HTTPException(status_code=422, detail="Use category or category_id, not both")
        payload["category_id"] = _resolve_category_id(client, user.id, transaction.category)
    if not payload:
        raise HTTPException(status_code=400, detail="At least one field must be provided")

    result = (
        client
        .table("transactions")
        .update(payload)
        .eq("id", str(transaction_id))
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise _not_found()
    row = result.data[0]
    if transaction.category:
        row = {**row, "category": transaction.category.strip()}
    return row


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: UUID,
    user: Annotated[AuthenticatedUser, Depends(get_current_supabase_user)],
):
    result = (
        get_supabase_client(user.access_token)
        .table("transactions")
        .delete()
        .eq("id", str(transaction_id))
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise _not_found()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
