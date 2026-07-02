"""
Person 3: Khai Kieu part for  User authentication as well as register/login endpoints in FastAPI,
password hashing, session/token management, per-user data isolation
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from auth import hash_password, verify_password, create_access_token
from database import get_supabase_client

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(req: RegisterRequest):
    supabase = get_supabase_client()
    # check if the email is already taken before inserting a new row
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