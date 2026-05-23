import os
import logging
import time
from typing import Optional

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User

logger = logging.getLogger("luminary.auth")

# ── Configuration ────────────────────────────────────────────
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")
_jwks_client: Optional[PyJWKClient] = None
_jwks_last_fetch: float = 0


class UserObject:
    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email


def _get_jwks_client() -> PyJWKClient:
    """Lazy-init and cache JWKS client (refreshes every 60 minutes)."""
    global _jwks_client, _jwks_last_fetch
    now = time.time()
    url = CLERK_JWKS_URL or os.getenv("CLERK_JWKS_URL", "")
    if not url:
        raise RuntimeError("CLERK_JWKS_URL not configured")
    if _jwks_client is None or (now - _jwks_last_fetch) > 3600:
        _jwks_client = PyJWKClient(url, cache_keys=True)
        _jwks_last_fetch = now
    return _jwks_client


def _extract_bearer_token(request: Request) -> str:
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return auth_header[7:]


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserObject:
    """
    FastAPI dependency: verify Clerk JWT and return UserObject.
    Also ensures a User row exists in the database.
    """
    try:
        token = _extract_bearer_token(request)
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        email = payload.get("email", "")
        await _ensure_user_exists(db, user_id, email)
        return UserObject(id=user_id, email=email)

    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def _ensure_user_exists(
    db: AsyncSession,
    user_id: str,
    email: Optional[str] = None,
) -> None:
    """Create user row if it doesn't exist yet (first-login upsert)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        db.add(User(id=user_id, email=email))
        await db.flush()

