"""
Luminary — PDF parsing service using PyMuPDF (fitz).
Extracts text block-by-block preserving page numbers and section structure.
PDF bytes are processed in-memory and NEVER persisted to disk or transmitted.
"""

import fitz  # PyMuPDF
from typing import List, Dict


def extract_text_from_pdf(pdf_bytes: bytes) -> Dict:
    """
    Parse PDF bytes and extract text block-by-block.
    PDF bytes are only held in memory during parsing — never stored.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages: List[Dict] = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        blocks = page.get_text("blocks")
        page_text_parts: List[str] = []

        for block in blocks:
            if block[6] == 0:  # text block, not image
                text = block[4].strip()
                if text:
                    page_text_parts.append(text)

        pages.append({
            "page_number": page_num + 1,
            "text": "\n".join(page_text_parts),
        })

    result = {"page_count": len(doc), "pages": pages}
    doc.close()
    return result


def chunk_text(
    pages: List[Dict],
    doc_id: str,
    user_id: str,
    max_tokens: int = 400,
    overlap_tokens: int = 50,
) -> List[Dict]:
    """
    Split extracted pages into overlapping chunks.
    Each chunk tagged with doc_id, user_id, page_number, chunk_index.
    """
    chunks: List[Dict] = []
    chunk_index = 0

    for page in pages:
        text = page["text"]
        if not text.strip():
            continue

        words = text.split()
        start = 0

        while start < len(words):
            end = min(start + max_tokens, len(words))
            chunk_words = words[start:end]
            chunk_text_str = " ".join(chunk_words)

            if chunk_text_str.strip():
                chunks.append({
                    "doc_id": doc_id,
                    "user_id": user_id,
                    "page_number": page["page_number"],
                    "chunk_index": chunk_index,
                    "text": chunk_text_str,
                })
                chunk_index += 1

            start += max_tokens - overlap_tokens

    return chunks
