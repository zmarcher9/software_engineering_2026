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
