import os

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException
from supabase import Client, create_client

load_dotenv()

_supabase_client: Client | None = None


def normalize_supabase_url(url: str) -> str:
    """Use the project base URL (https://<ref>.supabase.co), not /rest/v1 paths."""
    base = url.strip().rstrip("/")
    if "/rest/" in base:
        base = base.split("/rest/")[0].rstrip("/")
    return base


def ssl_verify_enabled() -> bool:
    value = os.getenv("SUPABASE_SSL_VERIFY", "true").strip().lower()
    return value not in {"0", "false", "no"}


def get_supabase_client() -> Client:
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        raise RuntimeError(
            "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env"
        )

    _supabase_client = create_client(normalize_supabase_url(url), key)
    return _supabase_client


def test_supabase_connection() -> dict:
    try:
        get_supabase_client()
        url = normalize_supabase_url(os.getenv("SUPABASE_URL", ""))
        key = os.getenv("SUPABASE_ANON_KEY")
        response = httpx.get(
            f"{url}/auth/v1/health",
            headers={"apikey": key},
            timeout=10.0,
            verify=ssl_verify_enabled(),
        )
        response.raise_for_status()
        return {"status": "ok", "database": "connected"}
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Supabase connection failed: {exc}",
        ) from exc
