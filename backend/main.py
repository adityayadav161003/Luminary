"""
Luminary — PDF Intelligence Platform API.
All endpoints protected by Clerk JWT (except /health).
All data scoped to user_id. PDF bytes processed in-memory and never stored.
"""

import os
import uuid
import json
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from database import init_db, get_db
from models import Document, Chunk, ChatSession, ChatMessage
from schemas import (
    HealthResponse, UploadResponse, DocumentOut, DocumentListResponse,
    DeleteResponse, ChatRequest, SessionOut, SessionListResponse,
    MessageOut, MessageListResponse,
)
from auth import get_current_user, UserObject
from rate_limit import check_query_rate_limit, check_upload_limit
from services.pdf_parser import extract_text_from_pdf, chunk_text
from services.embeddings import embed_texts
from services.vector_store import add_vectors, rebuild_index, get_index
from services.retrieval import retrieve_chunks, build_context_prompt
from services.chat import stream_chat_response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("luminary")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Luminary starting — initializing database and FAISS index")
    await init_db()
    idx = get_index()
    logger.info(f"FAISS index loaded: {idx.ntotal} vectors")
    # Pre-warm embedding model to avoid cold-start timeout on first request
    from services.embeddings import get_model
    logger.info("Pre-loading sentence-transformer model...")
    get_model()
    logger.info("Embedding model ready")
    yield
    logger.info("Luminary shutting down")


app = FastAPI(title="Luminary API", version="1.0.0", lifespan=lifespan)

# CORS
allowed = os.getenv("ALLOWED_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed] if allowed != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# HEALTH (public)
# ═══════════════════════════════════════════════════════════════
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    return HealthResponse()


# ═══════════════════════════════════════════════════════════════
# UPLOAD (protected)
# ═══════════════════════════════════════════════════════════════
@app.post("/upload", response_model=UploadResponse, tags=["Documents"])
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: UserObject = Depends(get_current_user),
):
    user_id = user.id
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    content = await file.read()
    file_size = len(content)

    # Rate limit check
    doc_count = await db.scalar(
        select(func.count(Document.id)).where(Document.user_id == user_id)
    )
    check_upload_limit(user_id, doc_count or 0, file_size)

    doc_id = str(uuid.uuid4())

    try:
        # Parse — PDF bytes held in memory only, never persisted
        parsed = extract_text_from_pdf(content)
        page_count = parsed["page_count"]
        if page_count == 0:
            raise HTTPException(400, "PDF has no pages")

        chunks = chunk_text(parsed["pages"], doc_id, user_id)
        if not chunks:
            raise HTTPException(400, "No extractable text found (image-only PDF?)")

        # Store metadata
        doc = Document(
            id=doc_id, user_id=user_id, filename=file.filename,
            page_count=page_count, chunk_count=len(chunks), file_size_bytes=file_size,
        )
        db.add(doc)
        await db.flush()

        # Store chunks
        chunk_models = []
        for c in chunks:
            cm = Chunk(
                doc_id=doc_id, user_id=user_id,
                page_number=c["page_number"], chunk_index=c["chunk_index"], text=c["text"],
            )
            chunk_models.append(cm)
            db.add(cm)
        await db.flush()

        # Embed and index
        embeddings = embed_texts([c["text"] for c in chunks])
        chunk_ids = [cm.id for cm in chunk_models]
        add_vectors(embeddings, chunk_ids)

        # Store FAISS row IDs back
        for cm, fid in zip(chunk_models, chunk_ids):
            cm.faiss_row_id = fid
        await db.commit()

        logger.info(f"Uploaded {file.filename}: {page_count}p, {len(chunks)} chunks (user={user_id})")
        return UploadResponse(doc_id=doc_id, filename=file.filename, chunk_count=len(chunks), page_count=page_count)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Upload failed: {e}")
        raise HTTPException(500, f"Failed to process PDF: {e}")


# ═══════════════════════════════════════════════════════════════
# DOCUMENTS (protected)
# ═══════════════════════════════════════════════════════════════
@app.get("/documents", response_model=DocumentListResponse, tags=["Documents"])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    user: UserObject = Depends(get_current_user),
):
    user_id = user.id
    stmt = select(Document).where(Document.user_id == user_id).order_by(Document.upload_time.desc())
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return DocumentListResponse(
        documents=[
            DocumentOut(
                doc_id=d.id, filename=d.filename, upload_time=d.upload_time,
                page_count=d.page_count, chunk_count=d.chunk_count, file_size_bytes=d.file_size_bytes,
            ) for d in docs
        ],
        total=len(docs),
    )


@app.delete("/documents/{doc_id}", response_model=DeleteResponse, tags=["Documents"])
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: UserObject = Depends(get_current_user),
):
    user_id = user.id
    doc = await db.scalar(select(Document).where(Document.id == doc_id, Document.user_id == user_id))
    if not doc:
        raise HTTPException(404, "Document not found")

    await db.delete(doc)
    await db.commit()

    # Rebuild FAISS index from remaining chunks in SQLite
    stmt = select(Chunk)
    res = await db.execute(stmt)
    remaining_chunks = res.scalars().all()

    from services.vector_store import rebuild_index
    try:
        rebuild_index(
            [c.id for c in remaining_chunks],
            [c.text for c in remaining_chunks]
        )
    except Exception as e:
        logger.error(f"Failed to rebuild FAISS index: {e}")

    return DeleteResponse(message="Deleted", doc_id=doc_id)


# ═══════════════════════════════════════════════════════════════
# CHAT (protected, SSE streaming)
# ═══════════════════════════════════════════════════════════════
@app.post("/chat", tags=["Chat"])
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: UserObject = Depends(get_current_user),
):
    user_id = user.id
    check_query_rate_limit(user_id)

    # Validate docs belong to user
    for did in request.doc_ids:
        doc = await db.scalar(select(Document).where(Document.id == did, Document.user_id == user_id))
        if not doc:
            raise HTTPException(400, f"Document {did} not found")

    # Session management
    session_id = request.session_id
    if not session_id:
        session_id = str(uuid.uuid4())
        session = ChatSession(id=session_id, user_id=user_id, title=request.query[:60])
        db.add(session)
        await db.flush()
    else:
        sess = await db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id))
        if not sess:
            # Auto-create session if it exists in client localStorage but not in db
            sess = ChatSession(id=session_id, user_id=user_id, title=request.query[:60])
            db.add(sess)
            await db.flush()

    # Save user message
    user_msg = ChatMessage(id=str(uuid.uuid4()), session_id=session_id, role="user", content=request.query)
    db.add(user_msg)
    await db.commit()

    # Retrieve chunks
    chunks = await retrieve_chunks(request.query, request.doc_ids, user_id, db)
    context = build_context_prompt(chunks)

    sources = [
        {"filename": c["filename"], "page_number": c["page_number"],
         "chunk_text": c["text"][:200], "relevance_score": round(c.get("score", 0), 3)}
        for c in chunks
    ]

    collected_tokens: list[str] = []

    async def event_stream():
        async for sse_chunk in stream_chat_response(request.query, context):
            if sse_chunk.strip().startswith("data: "):
                data_str = sse_chunk.replace("data: ", "").strip()
                if data_str == "[DONE]" or data_str == "[done]":
                    continue
                try:
                    parsed = json.loads(data_str)
                    if "token" in parsed:
                        token = parsed["token"]
                        collected_tokens.append(token)
                        yield f"data: {json.dumps({'token': token})}\n\n"
                    elif "error" in parsed:
                        yield f"data: {json.dumps({'error': parsed['error']})}\n\n"
                except Exception:
                    pass

        # After the stream completes, emit the citations event matching frontend SSECitationEvent shape
        citation_sources = [
            {
                "filename": c["filename"],
                "page_number": c["page_number"],
                "chunk_text": c["text"][:200],
                "relevance_score": round(c.get("score", 0), 3),
            }
            for c in chunks[:5]
        ]
        yield f"data: {json.dumps({'citations': citation_sources, 'session_id': session_id})}\n\n"

        # Then emit [DONE]
        yield "data: [DONE]\n\n"

        # Persist assistant message after stream completes
        try:
            full_response = "".join(collected_tokens)
            if full_response:
                asst_msg = ChatMessage(
                    id=str(uuid.uuid4()), session_id=session_id,
                    role="assistant", content=full_response, sources_json=sources,
                )
                db.add(asst_msg)
                await db.commit()
        except Exception as e:
            logger.error(f"Failed to persist assistant message: {e}")

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ═══════════════════════════════════════════════════════════════
# SESSIONS (protected)
# ═══════════════════════════════════════════════════════════════
@app.get("/sessions", response_model=SessionListResponse, tags=["Sessions"])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    user: UserObject = Depends(get_current_user),
):
    user_id = user.id
    stmt = select(ChatSession).where(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc())
    result = await db.execute(stmt)
    sessions = result.scalars().all()

    session_outs = []
    for s in sessions:
        count = await db.scalar(select(func.count(ChatMessage.id)).where(ChatMessage.session_id == s.id))
        session_outs.append(SessionOut(id=s.id, title=s.title, created_at=s.created_at, message_count=count or 0))

    return SessionListResponse(sessions=session_outs)


@app.get("/sessions/{session_id}/messages", response_model=MessageListResponse, tags=["Sessions"])
async def get_session_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user: UserObject = Depends(get_current_user),
):
    user_id = user.id
    sess = await db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id))
    if not sess:
        raise HTTPException(404, "Session not found")

    msgs = (await db.execute(
        select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
    )).scalars().all()

    return MessageListResponse(
        messages=[MessageOut(id=m.id, role=m.role, content=m.content, sources_json=m.sources_json, created_at=m.created_at) for m in msgs],
        session_id=session_id,
    )


@app.delete("/sessions/{session_id}", response_model=DeleteResponse, tags=["Sessions"])
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user: UserObject = Depends(get_current_user),
):
    user_id = user.id
    sess = await db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id))
    if not sess:
        raise HTTPException(404, "Session not found")

    await db.delete(sess)
    await db.commit()
    return DeleteResponse(message="Session deleted", doc_id=session_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
