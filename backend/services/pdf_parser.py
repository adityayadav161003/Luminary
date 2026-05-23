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


import re

def chunk_text(
    pages: List[Dict],
    doc_id: str,
    user_id: str,
    max_chars: int = 1000,
    overlap_chars: int = 200,
) -> List[Dict]:
    """
    Smart semantic-aware chunker that splits text into cohesive blocks.
    Respects paragraph boundaries first, then sentences, to maintain
    linguistic context for RAG embeddings.
    """
    chunks: List[Dict] = []
    chunk_index = 0

    for page in pages:
        text = page["text"]
        if not text.strip():
            continue

        # Split into paragraphs
        paragraphs = text.split("\n\n")
        current_chunk = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # If a single paragraph is too large, split into sentences
            if len(para) > max_chars:
                # Simple sentence splitter using lookbehind
                sentences = re.split(r"(?<=[.!?])\s+", para)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    
                    if current_length + len(sentence) + 1 > max_chars:
                        # Flush current chunk
                        if current_chunk:
                            chunk_text_str = " ".join(current_chunk)
                            chunks.append({
                                "doc_id": doc_id,
                                "user_id": user_id,
                                "page_number": page["page_number"],
                                "chunk_index": chunk_index,
                                "text": chunk_text_str,
                            })
                            chunk_index += 1
                        
                        # Handle overlap by taking a suffix of current sentences
                        overlap_len = 0
                        overlap_chunk = []
                        for s in reversed(current_chunk):
                            if overlap_len + len(s) + 1 < overlap_chars:
                                overlap_chunk.insert(0, s)
                                overlap_len += len(s) + 1
                            else:
                                break
                        current_chunk = overlap_chunk
                        current_length = overlap_len

                    current_chunk.append(sentence)
                    current_length += len(sentence) + 1
            else:
                if current_length + len(para) + 1 > max_chars:
                    # Flush current chunk
                    if current_chunk:
                        chunk_text_str = " ".join(current_chunk)
                        chunks.append({
                            "doc_id": doc_id,
                            "user_id": user_id,
                            "page_number": page["page_number"],
                            "chunk_index": chunk_index,
                            "text": chunk_text_str,
                        })
                        chunk_index += 1
                    
                    # Handle overlap by taking suffix
                    overlap_len = 0
                    overlap_chunk = []
                    for s in reversed(current_chunk):
                        if overlap_len + len(s) + 1 < overlap_chars:
                            overlap_chunk.insert(0, s)
                            overlap_len += len(s) + 1
                        else:
                            break
                    current_chunk = overlap_chunk
                    current_length = overlap_len

                current_chunk.append(para)
                current_length += len(para) + 1

        # Flush any remaining text on the page
        if current_chunk:
            chunk_text_str = " ".join(current_chunk)
            chunks.append({
                "doc_id": doc_id,
                "user_id": user_id,
                "page_number": page["page_number"],
                "chunk_index": chunk_index,
                "text": chunk_text_str,
            })
            chunk_index += 1

    return chunks
