from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth import create_access_token, get_current_user, hash_password, verify_password
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

    supabase = get_supabase_client()
    existing = supabase.table("users").select("id").eq("email", req.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(req.password)
    result = supabase.table("users").insert({"email": req.email, "password_hash": hashed}).execute()
    user_id = result.data[0]["id"]
    token = create_access_token(user_id)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
def login(req: LoginRequest):
    supabase = get_supabase_client()
    result = supabase.table("users").select("id, password_hash").eq("email", req.email).execute()
    # if no user found, or password doesn't match, give the same generic error either way
    if not result.data or not verify_password(req.password, result.data[0]["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(result.data[0]["id"])
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def read_current_user(user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("users").select("id, email").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]
