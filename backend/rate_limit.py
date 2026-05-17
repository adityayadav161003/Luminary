"""
Luminary — In-memory rate limiter.
Free plan: 50 queries/day per user, 10 total document uploads per user, 20MB per file.
Upgrade to Redis-backed in production when needed.
"""

import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple
from fastapi import HTTPException

# ── Limits ───────────────────────────────────────────────────
DAILY_QUERY_LIMIT = 50
TOTAL_DOCUMENT_LIMIT = 10
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

# ── In-memory tracking ──────────────────────────────────────
# Structure: {user_id: (count, window_start_timestamp)}
_query_counts: Dict[str, Tuple[int, float]] = {}


def _get_day_start() -> float:
    """Get the start of the current UTC day as a timestamp."""
    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return day_start.timestamp()


def _get_reset_time() -> str:
    """Get the ISO timestamp when the daily limit resets (next midnight UTC)."""
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return tomorrow.isoformat()


def check_query_rate_limit(user_id: str) -> None:
    """
    Check if user has exceeded daily query limit.
    Raises 429 HTTPException if limit reached.
    """
    day_start = _get_day_start()

    if user_id in _query_counts:
        count, window = _query_counts[user_id]
        if window < day_start:
            # New day — reset
            _query_counts[user_id] = (1, time.time())
            return
        if count >= DAILY_QUERY_LIMIT:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Daily limit reached",
                    "limit": DAILY_QUERY_LIMIT,
                    "reset_at": _get_reset_time(),
                },
            )
        _query_counts[user_id] = (count + 1, window)
    else:
        _query_counts[user_id] = (1, time.time())


def check_upload_limit(user_id: str, current_doc_count: int, file_size: int) -> None:
    """
    Check document upload limits.
    Raises 429 or 413 HTTPException if limits exceeded.
    """
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size {file_size / (1024*1024):.1f}MB exceeds maximum of 20MB",
        )

    if current_doc_count >= TOTAL_DOCUMENT_LIMIT:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Document upload limit reached",
                "limit": TOTAL_DOCUMENT_LIMIT,
                "reset_at": "Upgrade to Pro for unlimited uploads",
            },
        )
