# Graph Report - IntelliPDFChat  (2026-05-24)

## Corpus Check
- 42 files · ~27,112 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 197 nodes · 268 edges · 14 communities detected
- Extraction: 74% EXTRACTED · 26% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 34|Community 34]]

## God Nodes (most connected - your core abstractions)
1. `Luminary — PDF Intelligence Platform API. All endpoints protected by Clerk JWT (` - 16 edges
2. `User` - 13 edges
3. `Base` - 9 edges
4. `upload_document()` - 9 edges
5. `Chunk` - 8 edges
6. `Document` - 7 edges
7. `get_index()` - 7 edges
8. `apiFetch()` - 7 edges
9. `get_current_user()` - 6 edges
10. `chat()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `UserObject` --uses--> `Luminary — PDF Intelligence Platform API. All endpoints protected by Clerk JWT (`  [INFERRED]
  backend\auth.py → backend\main.py
- `Lazy-init JWKS client (cached after first call).` --uses--> `User`  [INFERRED]
  backend\auth.py → backend\models.py
- `Extract Bearer token from Authorization header.` --uses--> `User`  [INFERRED]
  backend\auth.py → backend\models.py
- `FastAPI dependency: verify Clerk JWT and return UserObject.     Also ensures a U` --uses--> `User`  [INFERRED]
  backend\auth.py → backend\models.py
- `Create user row if it doesn't exist yet (first-login upsert).` --uses--> `User`  [INFERRED]
  backend\auth.py → backend\models.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (12): handleDel(), handleDelete(), loadSession(), apiFetch(), authHeaders(), deleteDocument(), deleteSession(), getSessionMessages() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (22): delete_document(), delete_session(), get_session_messages(), health(), list_documents(), list_sessions(), Luminary — PDF Intelligence Platform API. All endpoints protected by Clerk JWT (, ChatRequest (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (15): embed_query(), embed_texts(), get_model(), Luminary — Local embedding service using sentence-transformers. Model: all-MiniL, 1. Embed query locally     2. FAISS search top_k_faiss, filter by user_id     3., retrieve_chunks(), add_vectors(), get_index() (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.2
Nodes (14): _ensure_user_exists(), _extract_bearer_token(), get_current_user(), _get_jwks_client(), Luminary — Clerk JWT verification.  Verifies Authorization: Bearer <token> heade, Create user row if it doesn't exist yet (first-login upsert)., Lazy-init JWKS client (cached after first call)., Extract Bearer token from Authorization header. (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (12): Base, chat(), ChatMessage, ChatSession, Chunk, Document, Luminary — SQLAlchemy ORM models. All data is scoped to Clerk user_id. PDF bytes, Text chunk extracted from a PDF page. PDF bytes never stored — only parsed text. (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (1): ClerkMissing()

### Community 6 - "Community 6"
Cohesion: 0.24
Nodes (9): check_query_rate_limit(), check_upload_limit(), _get_day_start(), _get_reset_time(), Luminary — In-memory rate limiter. Free plan: 50 queries/day per user, 10 total, Get the start of the current UTC day as a timestamp., Get the ISO timestamp when the daily limit resets (next midnight UTC)., Check if user has exceeded daily query limit.     Raises 429 HTTPException if li (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.36
Nodes (6): handleRetentionChange(), handleSecurityAction(), handleToggleAutoVectorize(), handleToggleContextMemory(), saveProfile(), showToast()

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (7): upload_document(), UploadResponse, chunk_text(), extract_text_from_pdf(), Luminary — PDF parsing service using PyMuPDF (fitz). Extracts text block-by-bloc, Parse PDF bytes and extract text block-by-block.     PDF bytes are only held in, Smart semantic-aware chunker that splits text into cohesive blocks.     Respects

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (2): goToPage(), handlePageInput()

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (3): init_db(), Luminary — Database configuration. SQLite via SQLAlchemy async engine. All user, lifespan()

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (4): _get_client(), Luminary — Chat service via OpenRouter API. Only the query text and context are, Stream chat completion from OpenRouter via SSE.     Only query text is transmitt, stream_chat_response()

### Community 12 - "Community 12"
Cohesion: 0.4
Nodes (2): SessionSidebar(), createApiClient()

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): Split extracted pages into overlapping chunks.     Each chunk tagged with doc_id

## Knowledge Gaps
- **21 isolated node(s):** `Luminary — Database configuration. SQLite via SQLAlchemy async engine. All user`, `Luminary — In-memory rate limiter. Free plan: 50 queries/day per user, 10 total`, `Get the start of the current UTC day as a timestamp.`, `Get the ISO timestamp when the daily limit resets (next midnight UTC).`, `Check if user has exceeded daily query limit.     Raises 429 HTTPException if li` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 5`** (11 nodes): `App.tsx`, `ClerkMissing()`, `handleMouseMove()`, `handleNewAnalysis()`, `handleRateLimit()`, `handleResetDocIdsSelection()`, `handleSignOut()`, `handleToastEvent()`, `Loader()`, `ProtectedRoute()`, `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (6 nodes): `goToPage()`, `handlePageInput()`, `handleRetry()`, `zoomIn()`, `zoomOut()`, `PDFViewer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (5 nodes): `getRelativeTimeShort()`, `SessionSidebar()`, `api.ts`, `SessionSidebar.tsx`, `createApiClient()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `Split extracted pages into overlapping chunks.     Each chunk tagged with doc_id`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `upload_document()` connect `Community 8` to `Community 1`, `Community 2`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `Luminary — PDF Intelligence Platform API. All endpoints protected by Clerk JWT (` connect `Community 1` to `Community 8`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `User` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 15 inferred relationships involving `Luminary — PDF Intelligence Platform API. All endpoints protected by Clerk JWT (` (e.g. with `Document` and `Chunk`) actually correct?**
  _`Luminary — PDF Intelligence Platform API. All endpoints protected by Clerk JWT (` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `User` (e.g. with `UserObject` and `Lazy-init JWKS client (cached after first call).`) actually correct?**
  _`User` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `Base` (e.g. with `User` and `Document`) actually correct?**
  _`Base` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `upload_document()` (e.g. with `check_upload_limit()` and `extract_text_from_pdf()`) actually correct?**
  _`upload_document()` has 8 INFERRED edges - model-reasoned connections that need verification._