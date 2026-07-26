from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth import AuthenticatedUser, get_current_supabase_user
from database import get_supabase_client

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr


def validate_password(password: str) -> None:
    if not any(char.isdigit() for char in password):
        raise HTTPException(status_code=400, detail="Password must include at least one number")
    if not any(char.isalpha() for char in password):
        raise HTTPException(status_code=400, detail="Password must include at least one letter")


@router.post("/register")
def register(req: RegisterRequest):
    validate_password(req.password)
    try:
        result = get_supabase_client().auth.sign_up(
            {"email": str(req.email), "password": req.password}
        )
    except Exception as exc:
        detail = str(exc).lower()
        if "already" in detail or "registered" in detail or "exists" in detail:
            raise HTTPException(status_code=400, detail="Email already registered") from exc
        raise HTTPException(status_code=400, detail="Registration failed") from exc

    if result.session is None:
        return {
            "access_token": None,
            "token_type": "bearer",
            "requires_email_confirmation": True,
        }
    return {
        "access_token": result.session.access_token,
        "token_type": "bearer",
        "requires_email_confirmation": False,
    }


@router.post("/login")
def login(req: LoginRequest):
    try:
        result = get_supabase_client().auth.sign_in_with_password(
            {"email": str(req.email), "password": req.password}
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid email or password") from exc
    if result.session is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": result.session.access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def read_current_user(user: AuthenticatedUser = Depends(get_current_supabase_user)):
    return {"id": user.id, "email": user.email}
