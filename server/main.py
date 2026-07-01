from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from enum import Enum

from database import get_supabase_client, test_supabase_connection

app = FastAPI(title="FlowFunds API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    
    For MVP, we'll use a hardcoded user_id placeholder.
    Once Person 3's JWT middleware is ready, this will extract user_id from the token.
    """
    try:
        supabase = get_supabase_client()

        # MVP: Use placeholder user_id - will be replaced with JWT extraction
        user_id = "placeholder-user-id"

        # Prepare data for insertion
        transaction_data = {
            "user_id": user_id,
            "amount": transaction.amount,
            "category_id": transaction.category_id,
            "transaction_type": transaction.transaction_type.value,
            "transaction_date": transaction.transaction_date.isoformat(),
            "note": transaction.note,
            "merchant": transaction.merchant,
        }

        # Insert into database
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
    Get categories for the authenticated user (MVP: returns mock categories)
    Once Person 3's JWT middleware is ready, this will fetch real categories from database.
    """
    # MVP: Return mock categories - will be replaced with database fetch once auth is ready
    return [
        Category(id="food", name="Food & Dining"),
        Category(id="transport", name="Transport"),
        Category(id="utilities", name="Utilities"),
        Category(id="entertainment", name="Entertainment"),
        Category(id="salary", name="Salary"),
        Category(id="bonus", name="Bonus"),
        Category(id="other", name="Other"),
    ]

