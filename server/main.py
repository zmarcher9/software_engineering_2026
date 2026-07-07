import os
import uuid
from datetime import date
from enum import Enum
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

from database import get_supabase_client, test_supabase_connection

app = FastAPI(title="FlowFunds API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Data Models
# ============================================================================

class TransactionType(str, Enum):
    expense = "expense"
    income = "income"


class TransactionCreate(BaseModel):
    """Request body for creating a transaction"""

    amount: float = Field(..., gt=0, le=999999999.99, description="Amount must be positive")
    category_id: Optional[str] = Field(None, description="UUID of category, optional")
    transaction_date: date = Field(..., description="Date of the transaction")
    note: Optional[str] = Field(None, description="Optional note about the transaction")
    merchant: Optional[str] = Field(None, description="Optional merchant name")
    transaction_type: TransactionType = Field(default=TransactionType.expense)


class TransactionResponse(BaseModel):
    """Response body for transaction endpoints"""

    id: str
    user_id: str
    amount: float
    category_id: Optional[str]
    transaction_type: str
    transaction_date: date
    note: Optional[str]
    merchant: Optional[str]
    created_at: str
    updated_at: str


class Category(BaseModel):
    """Category response"""

    id: str
    name: str
    user_id: Optional[str] = None


def _get_or_create_default_user(supabase) -> str:
    default_email = os.getenv("DEFAULT_USER_EMAIL", "placeholder@example.com")
    default_name = os.getenv("DEFAULT_USER_NAME", "FlowFunds MVP User")

    existing_user = (
        supabase.table("users")
        .select("id")
        .eq("email", default_email)
        .maybe_single()
        .execute()
    )

    if existing_user.data:
        return existing_user.data["id"]

    first_name, _, last_name = default_name.partition(" ")
    user_id = str(uuid.uuid4())
    created_user = (
        supabase.table("users")
        .insert(
            {
                "id": user_id,
                "email": default_email,
                "first_name": first_name,
                "last_name": last_name,
            }
        )
        .execute()
    )

    if not created_user.data:
        raise HTTPException(status_code=500, detail="Failed to create default user")

    return created_user.data[0]["id"]


def _ensure_default_categories(supabase, user_id: str) -> None:
    existing_categories = (
        supabase.table("categories")
        .select("name")
        .eq("user_id", user_id)
        .execute()
    )

    existing_names = {
        item["name"] for item in (existing_categories.data or []) if item.get("name")
    }

    default_categories = [
        "Food & Dining",
        "Transport",
        "Utilities",
        "Entertainment",
        "Salary",
        "Bonus",
        "Other",
    ]

    for category_name in default_categories:
        if category_name in existing_names:
            continue

        supabase.table("categories").insert(
            {
                "user_id": user_id,
                "name": category_name,
            }
        ).execute()


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check():
    return test_supabase_connection()


# ============================================================================
# Transaction Endpoints
# ============================================================================

@app.post("/api/transactions", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate):
    """
    Create a new transaction (MVP: no auth required yet - will be added when Person 3 completes auth)

    For MVP, we create a default user and categories if needed.
    Once Person 3's JWT middleware is ready, this will extract user_id from the token.
    """
    try:
        supabase = get_supabase_client()
        user_id = _get_or_create_default_user(supabase)
        _ensure_default_categories(supabase, user_id)

        category_id = transaction.category_id
        if category_id:
            existing_category = (
                supabase.table("categories")
                .select("id")
                .eq("id", category_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            if not existing_category.data:
                category_id = None

        transaction_data = {
            "user_id": user_id,
            "amount": transaction.amount,
            "category_id": category_id,
            "transaction_type": transaction.transaction_type.value,
            "transaction_date": transaction.transaction_date.isoformat(),
            "note": transaction.note,
            "merchant": transaction.merchant,
        }

        response = supabase.table("transactions").insert(transaction_data).execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to create transaction")

        created_transaction = response.data[0]
        return TransactionResponse(
            id=created_transaction["id"],
            user_id=created_transaction["user_id"],
            amount=created_transaction["amount"],
            category_id=created_transaction["category_id"],
            transaction_type=created_transaction["transaction_type"],
            transaction_date=created_transaction["transaction_date"],
            note=created_transaction["note"],
            merchant=created_transaction["merchant"],
            created_at=created_transaction["created_at"],
            updated_at=created_transaction["updated_at"],
        )

    except Exception as e:
        print(f"Error creating transaction: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to create transaction: {str(e)}")


@app.get("/api/transactions", response_model=list[TransactionResponse])
async def get_transactions():
    """
    Get all transactions for the authenticated user (MVP: returns all for placeholder user)
    Once Person 3's JWT middleware is ready, this will filter by authenticated user_id.
    """
    try:
        supabase = get_supabase_client()

        # MVP: Get all transactions (will be filtered by user_id once auth is ready)
        response = supabase.table("transactions").select("*").execute()

        if not response.data:
            return []

        return [
            TransactionResponse(
                id=t["id"],
                user_id=t["user_id"],
                amount=t["amount"],
                category_id=t["category_id"],
                transaction_type=t["transaction_type"],
                transaction_date=t["transaction_date"],
                note=t["note"],
                merchant=t["merchant"],
                created_at=t["created_at"],
                updated_at=t["updated_at"],
            )
            for t in response.data
        ]

    except Exception as e:
        print(f"Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch transactions: {str(e)}")


@app.get("/api/categories", response_model=list[Category])
async def get_categories():
    """
    Get categories for the authenticated user (MVP: returns the default user's categories)
    Once Person 3's JWT middleware is ready, this will fetch real categories from database.
    """
    try:
        supabase = get_supabase_client()
        user_id = _get_or_create_default_user(supabase)
        _ensure_default_categories(supabase, user_id)

        response = (
            supabase.table("categories")
            .select("id", "name")
            .eq("user_id", user_id)
            .execute()
        )

        return [
            Category(id=item["id"], name=item["name"])
            for item in (response.data or [])
        ]
    except Exception as e:
        print(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch categories: {str(e)}")

