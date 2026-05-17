"""
Luminary — Hybrid retrieval pipeline: FAISS semantic search + BM25 keyword re-rank.
All chunks are filtered by user_id to enforce data isolation.
"""

from rank_bm25 import BM25Okapi
from typing import List, Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Chunk, Document
from services.embeddings import embed_query
from services.vector_store import search_vectors


async def retrieve_chunks(
    query: str,
    doc_ids: List[str],
    user_id: str,
    db: AsyncSession,
    top_k_faiss: int = 12,
    top_k_final: int = 5,
) -> List[Dict]:
    """
    1. Embed query locally
    2. FAISS search top_k_faiss, filter by user_id
    3. BM25 re-rank → top_k_final
    """
    query_embedding = embed_query(query)
    faiss_results = search_vectors(query_embedding, top_k=top_k_faiss * 3)

    if not faiss_results:
        return []

    chunk_ids = [r[0] for r in faiss_results]
    faiss_scores = {r[0]: r[1] for r in faiss_results}

    # Fetch chunks filtered by user_id AND doc_ids
    stmt = (
        select(Chunk, Document.filename)
        .join(Document, Chunk.doc_id == Document.id)
        .where(Chunk.id.in_(chunk_ids))
        .where(Chunk.user_id == user_id)
        .where(Chunk.doc_id.in_(doc_ids))
    )
    result = await db.execute(stmt)
    rows = result.all()

    if not rows:
        return []

    candidates: List[Dict] = []
    for chunk, filename in rows:
        candidates.append({
            "chunk_id": chunk.id,
            "doc_id": chunk.doc_id,
            "filename": filename,
            "page_number": chunk.page_number,
            "chunk_index": chunk.chunk_index,
            "text": chunk.text,
            "faiss_score": faiss_scores.get(chunk.id, float("inf")),
        })

    candidates.sort(key=lambda x: x["faiss_score"])
    candidates = candidates[:top_k_faiss]

    if len(candidates) <= 1:
        for c in candidates:
            c["score"] = 1.0
        return candidates

    # BM25 re-rank
    tokenized_corpus = [c["text"].lower().split() for c in candidates]
    bm25 = BM25Okapi(tokenized_corpus)
    bm25_scores = bm25.get_scores(query.lower().split())

    max_faiss = max(c["faiss_score"] for c in candidates) or 1.0
    max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1.0

    for i, candidate in enumerate(candidates):
        faiss_norm = 1.0 - (candidate["faiss_score"] / max_faiss)
        bm25_norm = bm25_scores[i] / max_bm25
        candidate["score"] = 0.4 * faiss_norm + 0.6 * bm25_norm

    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[:top_k_final]


def build_context_prompt(chunks: List[Dict]) -> str:
    if not chunks:
        return "No relevant context was found in the uploaded documents."
    parts: List[str] = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(f"--- Context {i} [Source: {chunk['filename']}, Page {chunk['page_number']}] ---\n{chunk['text']}")
    return "\n\n".join(parts)
