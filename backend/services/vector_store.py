"""
Luminary — FAISS vector store with disk persistence.
Index survives server restarts — loaded from disk on startup, never re-embedded.
"""

import os
import numpy as np
import faiss
from typing import List, Tuple, Optional
import threading
import logging

logger = logging.getLogger("luminary.vector_store")

_lock = threading.Lock()
_index: Optional[faiss.IndexIDMap] = None
EMBEDDING_DIM = 384


def _get_index_dir() -> str:
    return os.getenv("FAISS_INDEX_PATH", "./faiss_store")


def _get_index_file() -> str:
    return os.path.join(_get_index_dir(), "index.faiss")


def get_index() -> faiss.IndexIDMap:
    global _index
    with _lock:
        if _index is not None:
            return _index
        index_dir = _get_index_dir()
        os.makedirs(index_dir, exist_ok=True)
        index_file = _get_index_file()
        if os.path.exists(index_file):
            base = faiss.read_index(index_file)
            _index = base if isinstance(base, faiss.IndexIDMap) else faiss.IndexIDMap(base)
            logger.info(f"FAISS index loaded from disk with {_index.ntotal} vectors")
        else:
            _index = faiss.IndexIDMap(faiss.IndexFlatL2(EMBEDDING_DIM))
            logger.info("FAISS index loaded from disk with 0 vectors")
        return _index


def save_index() -> None:
    with _lock:
        if _index is not None:
            path = _get_index_file()
            os.makedirs(os.path.dirname(path), exist_ok=True)
            faiss.write_index(_index, path)
            logger.info("FAISS index saved to disk")


def add_vectors(embeddings: np.ndarray, ids: List[int]) -> None:
    index = get_index()
    with _lock:
        index.add_with_ids(embeddings, np.array(ids, dtype=np.int64))
    save_index()


def search_vectors(query_embedding: np.ndarray, top_k: int = 12) -> List[Tuple[int, float]]:
    index = get_index()
    if index.ntotal == 0:
        return []
    actual_k = min(top_k, index.ntotal)
    distances, indices = index.search(query_embedding, actual_k)
    return [(int(indices[0][i]), float(distances[0][i])) for i in range(len(indices[0])) if int(indices[0][i]) != -1]


def rebuild_index(chunk_ids: List[int], chunk_texts: List[str]) -> None:
    """Rebuild the flat index from the remaining chunks in the SQLite database."""
    global _index
    with _lock:
        index_dir = _get_index_dir()
        os.makedirs(index_dir, exist_ok=True)
        path = _get_index_file()
        
        new_index = faiss.IndexIDMap(faiss.IndexFlatL2(EMBEDDING_DIM))
        if chunk_ids:
            from services.embeddings import embed_texts
            embeddings = embed_texts(chunk_texts)
            new_index.add_with_ids(embeddings, np.array(chunk_ids, dtype=np.int64))
            
        _index = new_index
        faiss.write_index(_index, path)
        logger.info("FAISS index saved to disk")

