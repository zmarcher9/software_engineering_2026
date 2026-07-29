from calendar import monthrange
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from auth import AuthenticatedUser, get_current_supabase_user
from database import get_supabase_client

router = APIRouter(prefix="/budgets", tags=["budgets"])


class BudgetAmount(BaseModel):
    limit_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class BudgetSummary(BaseModel):
    category_id: UUID
    category: str
    limit_amount: Decimal | None = None
    spent: Decimal


def _month_bounds() -> tuple[date, date]:
    today = datetime.now(timezone.utc).date()
    return today.replace(day=1), today.replace(day=monthrange(today.year, today.month)[1])


@router.get("", response_model=list[BudgetSummary])
def list_budgets(
    user: Annotated[AuthenticatedUser, Depends(get_current_supabase_user)],
):
    client = get_supabase_client(user.access_token)
    start, end = _month_bounds()
    categories = (
        client.table("categories")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name")
        .execute()
        .data
        or []
    )
    budgets = (
        client.table("budgets")
        .select("category_id, limit_amount")
        .eq("user_id", user.id)
        .eq("period", "monthly")
        .eq("start_date", start.isoformat())
        .execute()
        .data
        or []
    )
    transactions = (
        client.table("transactions")
        .select("category_id, amount, transaction_type, transaction_date")
        .eq("user_id", user.id)
        .gte("transaction_date", start.isoformat())
        .lte("transaction_date", end.isoformat())
        .execute()
        .data
        or []
    )

    limits = {row["category_id"]: Decimal(str(row["limit_amount"])) for row in budgets}
    spent = {}
    for row in transactions:
        if row.get("transaction_type") != "expense" or not row.get("category_id"):
            continue
        category_id = row["category_id"]
        spent[category_id] = spent.get(category_id, Decimal(0)) + Decimal(str(row["amount"]))

    return [
        {
            "category_id": category["id"],
            "category": category["name"],
            "limit_amount": limits.get(category["id"]),
            "spent": spent.get(category["id"], Decimal(0)),
        }
        for category in categories
        if category["name"] != "Salary"
    ]


@router.put("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def set_budget(
    category_id: UUID,
    budget: BudgetAmount,
    user: Annotated[AuthenticatedUser, Depends(get_current_supabase_user)],
):
    client = get_supabase_client(user.access_token)
    category = (
        client.table("categories")
        .select("id, name")
        .eq("id", str(category_id))
        .eq("user_id", user.id)
        .execute()
    )
    if not category.data:
        raise HTTPException(status_code=404, detail="Category not found")

    start, end = _month_bounds()
    payload = {
        "user_id": user.id,
        "category_id": str(category_id),
        "name": f"{category.data[0]['name']} monthly budget",
        "period": "monthly",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "limit_amount": str(budget.limit_amount),
    }
    client.table("budgets").upsert(
        payload,
        on_conflict="user_id,category_id,period,start_date",
    ).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    category_id: UUID,
    user: Annotated[AuthenticatedUser, Depends(get_current_supabase_user)],
):
    start, _ = _month_bounds()
    (
        get_supabase_client(user.access_token)
        .table("budgets")
        .delete()
        .eq("user_id", user.id)
        .eq("category_id", str(category_id))
        .eq("period", "monthly")
        .eq("start_date", start.isoformat())
        .execute()
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
