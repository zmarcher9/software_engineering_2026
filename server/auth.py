from dataclasses import dataclass
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: str
    access_token: str


def get_current_supabase_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> AuthenticatedUser:
    """Validate a Supabase access token and return the authenticated identity."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise credentials_exception

    # Import here to avoid an auth/database import cycle.
    from database import get_supabase_client

    try:
        response = get_supabase_client().auth.get_user(credentials.credentials)
        user = response.user
        if user is None or not user.id or not user.email:
            raise credentials_exception
        return AuthenticatedUser(
            id=str(user.id),
            email=str(user.email),
            access_token=credentials.credentials,
        )
    except HTTPException:
        raise
    except Exception:  # noqa: BLE001 - normalize all token validation failures to 401
        raise credentials_exception


def get_current_admin_user(
    user: Annotated[AuthenticatedUser, Depends(get_current_supabase_user)],
) -> AuthenticatedUser:
    """Require the caller to be an authenticated user with users.is_admin = true.

    Reads the flag through the caller's own request-scoped Supabase client, so
    the check is subject to the same users_select_own RLS policy every other
    query goes through (a user can always read their own is_admin flag).
    """
    # Import here to avoid an auth/database import cycle, matching
    # get_current_supabase_user above.
    from database import get_supabase_client

    client = get_supabase_client(user.access_token)
    result = client.table("users").select("is_admin").eq("id", user.id).execute()
    is_admin = bool(result.data and result.data[0].get("is_admin"))
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user
