from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import test_supabase_connection
from routes_auth import router as auth_router

app = FastAPI(title="FlowFunds API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check():
    return test_supabase_connection()
