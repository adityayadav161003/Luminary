"""
Luminary — Clerk JWT verification.

Verifies Authorization: Bearer <token> headers using Clerk JWKS endpoint.
Extracts user_id from the 'sub' claim. Ensures user row exists in SQLite.
This is a FastAPI dependency — never inline JWT logic in route handlers.
"""

import os
import logging
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


def _get_jwks_client() -> PyJWKClient:
    """Lazy-init JWKS client (cached after first call)."""
    global _jwks_client
    if _jwks_client is None:
        url = CLERK_JWKS_URL
        if not url:
            raise RuntimeError("CLERK_JWKS_URL not configured")
        _jwks_client = PyJWKClient(url, cache_keys=True)
    return _jwks_client


def _extract_bearer_token(request: Request) -> str:
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return auth_header[7:]


async def get_current_user_id(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    FastAPI dependency: verify Clerk JWT and return user_id.
    Also ensures a User row exists in the database (upsert on first sight).
    """
    token = _extract_bearer_token(request)

    # ── Development bypass ───────────────────────────────────
    # When CLERK_JWKS_URL is not set, accept "dev_<user_id>" tokens for local testing.
    if not CLERK_JWKS_URL:
        if token.startswith("dev_"):
            user_id = token
        else:
            user_id = "dev_user"
        await _ensure_user_exists(db, user_id)
        return user_id

    # ── Production: verify with Clerk JWKS ───────────────────
    try:
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
            raise HTTPException(status_code=401, detail="Token missing sub claim")

        email = payload.get("email")
        await _ensure_user_exists(db, user_id, email)
        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


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
