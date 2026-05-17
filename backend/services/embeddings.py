"""
Luminary — Local embedding service using sentence-transformers.
Model: all-MiniLM-L6-v2 — runs entirely on-device. No embedding API calls ever made.
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed_texts(texts: List[str]) -> np.ndarray:
    model = get_model()
    return model.encode(texts, show_progress_bar=False, convert_to_numpy=True).astype(np.float32)


def embed_query(query: str) -> np.ndarray:
    model = get_model()
    return model.encode([query], show_progress_bar=False, convert_to_numpy=True).astype(np.float32)
