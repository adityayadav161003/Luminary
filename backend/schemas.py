"""
Luminary — Pydantic schemas for all API endpoints.
No `Any` types. Every field is explicitly typed.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Health ───────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"


# ── Documents ────────────────────────────────────────────────
class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    page_count: int


class DocumentOut(BaseModel):
    doc_id: str
    filename: str
    upload_time: datetime
    page_count: int
    chunk_count: int
    file_size_bytes: int

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: List[DocumentOut]
    total: int


class DeleteResponse(BaseModel):
    message: str
    doc_id: str


# ── Chat ─────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    doc_ids: List[str] = Field(..., min_length=1)
    session_id: Optional[str] = None


class SourceRef(BaseModel):
    filename: str
    page_number: int
    chunk_text: str
    relevance_score: float


# ── Sessions ─────────────────────────────────────────────────
class SessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    sessions: List[SessionOut]


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    sources_json: Optional[List[SourceRef]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    messages: List[MessageOut]
    session_id: str


# ── Errors ───────────────────────────────────────────────────
class ErrorResponse(BaseModel):
    detail: str


class RateLimitError(BaseModel):
    error: str
    limit: int
    reset_at: str
