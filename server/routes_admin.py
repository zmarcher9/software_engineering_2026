from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from auth import AuthenticatedUser, get_current_admin_user
from database import get_supabase_client

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserSummary(BaseModel):
    id: str
    email: EmailStr
    is_admin: bool
    created_at: str
    category_count: int
    transaction_count: int
    total_income: str
    total_expenses: str


@router.get("/users", response_model=list[AdminUserSummary])
def list_all_users(
    admin: Annotated[AuthenticatedUser, Depends(get_current_admin_user)],
):
    """Read-only, cross-user view for admins.

    Uses the admin's own request-scoped Supabase client (their JWT), so this
    relies entirely on the categories_admin_select_all /
    transactions_admin_select_all RLS policies granting read access -- there
    is no service-role key or RLS bypass involved. A non-admin caller would
    get an empty result set here even before reaching get_current_admin_user,
    because Postgres would enforce the owner-only policy instead.
    """
    client = get_supabase_client(admin.access_token)

    users = (
        client.table("users")
        .select("id, email, is_admin, created_at")
        .execute()
        .data
        or []
    )
    categories = client.table("categories").select("user_id").execute().data or []
    transactions = (
        client.table("transactions")
        .select("user_id, amount, transaction_type")
        .execute()
        .data
        or []
    )

    summaries = []
    for user_row in users:
        user_id = user_row["id"]
        user_transactions = [t for t in transactions if t.get("user_id") == user_id]
        total_income = sum(
            (Decimal(str(t["amount"])) for t in user_transactions if t.get("transaction_type") == "income"),
            Decimal(0),
        )
        total_expenses = sum(
            (Decimal(str(t["amount"])) for t in user_transactions if t.get("transaction_type") == "expense"),
            Decimal(0),
        )
        summaries.append(
            {
                "id": user_id,
                "email": user_row["email"],
                "is_admin": bool(user_row.get("is_admin", False)),
                "created_at": user_row["created_at"],
                "category_count": sum(1 for c in categories if c.get("user_id") == user_id),
                "transaction_count": len(user_transactions),
                "total_income": str(total_income),
                "total_expenses": str(total_expenses),
            }
        )
    return summaries
