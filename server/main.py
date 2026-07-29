import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import test_supabase_connection
from routes_admin import router as admin_router
from routes_auth import router as auth_router
from routes_budgets import router as budgets_router
from routes_transactions import router as transactions_router

app = FastAPI(title="FlowFunds API", version="0.1.0")


def _parse_origins(raw: str) -> list[str]:
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


# CORS_ORIGINS: comma-separated exact origins, e.g.
#   "http://localhost:5173,https://flowfunds.vercel.app"
# CORS_ORIGIN_REGEX: optional regex for dynamic origins (e.g. Vercel preview
# URLs like https://flowfunds-git-<branch>-<team>.vercel.app). Falls back to
# localhost-only when nothing is configured, matching prior local-dev behavior.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
allow_origins = _parse_origins(os.getenv("CORS_ORIGINS", _default_origins))
allow_origin_regex = os.getenv("CORS_ORIGIN_REGEX") or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(transactions_router)
app.include_router(admin_router)
app.include_router(budgets_router)


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check():
    return test_supabase_connection()
