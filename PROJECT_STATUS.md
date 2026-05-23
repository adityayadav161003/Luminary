# Luminary Project Status & Roadmap

This document provides a comprehensive overview of the **Luminary** project: its original concept, what has been implemented so far, the implementation details, and what remains on the product roadmap.

---

## 📖 1. What Luminary Is

**Luminary** is a production-grade, privacy-first PDF intelligence platform designed to help users interactively converse with, extract insights from, and analyze complex PDF documents.

### 🛡️ Core Philosophy: Privacy-First
Unlike standard web tools that upload and store documents on external vector databases, Luminary processes files purely in-memory:
- **In-memory PDF Ingestion:** Text is parsed, chunked, and embedded on the server, and raw bytes are immediately discarded.
- **Local Embeddings:** Free and fast vectorization using open-source `sentence-transformers` running on the local host.
- **Hybrid Search RAG:** A retrieval mechanism combining dense vector search (FAISS) and lexical keyword search (BM25) for high retrieval accuracy.
- **Tenant Isolation:** Scoped data access enforced at the database query level via authenticated Clerk JWTs.

---

## 🛠️ 2. What Has Been Done & How It Was Completed

We successfully solved production security holes, introduced dynamic rendering capabilities, refined data splitting, and fully overhauled the visual user interface into a premium, state-of-the-art developer workspace.

### A. Production-Hardened Clerk Authentication & API Client
- **The Issue:** The platform previously relied on hardcoded `dev_user` bypassing tokens, which was a critical security vulnerability.
- **The Solution:** 
  - Completely removed developer bypasses from [backend/auth.py](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/backend/auth.py).
  - Configured live validation of Clerk JWTs using `PyJWKClient` fetched from `CLERK_JWKS_URL` with a 60-minute in-memory cache to prevent redundant JWKS network queries.
  - Setup a secure client-side API layer in [frontend/src/api.ts](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/api.ts) that dynamically fetches Clerk tokens via Clerk's React hook on every API call.
- **Result:** Fully secure, production-hardened user scoping and tenant isolation.

### B. Dynamic Local PDF Preview Rendering
- **The Issue:** The original workspace rendered a single static PDF mock file regardless of what document the user clicked on or uploaded.
- **The Solution:**
  - Expanded the Zustand state store in [frontend/src/store.ts](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/store.ts) to include a `pdfUrls` mapping.
  - Configured [frontend/src/components/DropZone.tsx](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/components/DropZone.tsx) to generate a browser Object URL (`URL.createObjectURL(file)`) when files are uploaded and register them inside the Zustand store mapping.
  - Rewrote [frontend/src/components/PDFViewer.tsx](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/components/PDFViewer.tsx) to fetch the browser Object URL associated with the selected document, enabling the system to render actual page canvas elements for uploaded PDFs.
- **Result:** Users see a real-time preview of their uploaded PDF side-by-side with their chat session.

### C. Smart Semantic Text Chunking
- **The Issue:** PDF documents were split into arbitrary word counts, cutting off sentences mid-thought and degrading RAG retrieval quality.
- **The Solution:**
  - Revamped the chunking engine in [backend/services/pdf_parser.py](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/backend/services/pdf_parser.py). 
  - Replaced the word splitter with a regex-based paragraph and sentence splitter that respects semantic boundaries first and falls back to sentence splits only if blocks exceed character limits.
- **Result:** Contextual integrity is preserved during embeddings generation, leading to highly coherent AI answers.

### D. Premium Dark-Glass Workspace Design
- **The Issue:** The initial frontend layout had basic, uninspiring colors and layouts that did not feel modern or premium.
- **The Solution:**
  - Imported **Outfit** and **Inter** font families via Google Fonts inside [frontend/src/index.css](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/index.css).
  - Defined CSS styling variables featuring deep-dark glass surfaces (`#07080A`, `#0D0E12`, `#13161D`) with subtle warm gold accents (`#E2B13C`).
  - Added modern features:
    - **Custom Scrollbars:** Thin, rounded pill-scrollbars matching the dark interface.
    - **Glassmorphic Cards:** Translucent panels using `backdrop-filter: blur(12px)` and thin border overlays.
    - **Micro-animations:** Glow transitions, active pinging status badges, and translation hover transitions.
  - Modernized all React panels: [App.tsx](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/App.tsx), [SessionSidebar.tsx](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/components/SessionSidebar.tsx), [DocumentList.tsx](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/components/DocumentList.tsx), [ChatPanel.tsx](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/components/ChatPanel.tsx), and [ChatInput.tsx](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/components/ChatInput.tsx).
- **Result:** A visual design that instantly stands out with high-end typography and interactive animations.

### E. Session Auto-Recovery
- **The Issue:** If a user refreshed the page with a session ID cached in their browser's `localStorage` that was missing in the backend database (e.g. following a DB reset), they would receive constant `404 Session Not Found` errors.
- **The Solution:**
  - Configured the `/chat` route in [backend/main.py](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/backend/main.py) to automatically instantiate a new database session record if a requested session ID is not found.
- **Result:** Zero session-mismatch disruptions for the user.

### F. Persistent FAISS Vector Store
- **The Issue:** Ephemeral in-memory vector index reset on every server reboot, resulting in data loss for uploaded PDF embeddings.
- **The Solution:**
  - Implemented disk caching using `faiss.read_index` and `faiss.write_index` pointed at a persistent `FAISS_INDEX_PATH` directory.
  - Added a `threading.Lock()` to prevent race conditions on concurrent uploads.
  - Created a robust `rebuild_index` function that gathers remaining chunks from SQLite, embeds them, and serializes a clean flat index on document deletion.
- **Result:** Vector storage persists across server restarts and remains synchronized during document additions/deletions.

### G. Multi-Document Retrieval
- **The Issue:** RAG queries could only target the single active document being viewed.
- **The Solution:**
  - Programmed vector metadata pre-filtering during retrieve phases in [backend/services/retrieval.py](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/backend/services/retrieval.py) to match checkmarked document IDs.
  - Added multi-checkboxes in [frontend/src/components/DocumentList.tsx](file:///c:/Users/Aditya/Desktop/IntelliPDFChat/frontend/src/components/DocumentList.tsx) along with a floating "docs selected" count chip.
- **Result:** Users can query multiple PDFs simultaneously and get cross-referenced answers.

### H. Streamed SSE Chat with Page Citations
- **The Issue:** The chat interface loaded the full response block at once, and citations didn't navigate to the PDF.
- **The Solution:**
  - Rewrote the client-side fetch code to decode SSE streams chunk-by-chunk using a `ReadableStream` reader.
  - Implemented token streaming with a flashing gold terminal block cursor.
  - Appended page citation chips (`[filename.pdf · Page N]`) which trigger page navigation canvas actions inside `PDFViewer.tsx` when clicked.
- **Result:** Dynamic streaming UI with clickable, functional page references.

### I. Global Rate Limiting Toasts
- **The Issue:** Rate limits (HTTP 429) was not handled user-facingly.
- **The Solution:**
  - Configured custom events dispatched from the API client to the main React application layer.
  - Rendered toast popups with warnings, showing local time reset calculations, and auto-dismissing after 8 seconds.
- **Result:** Smooth error feedback when users exceed limits.

### J. Responsive Mobile Tab Layout
- **The Issue:** Three-column layouts broke on narrow mobile viewports.
- **The Solution:**
  - Added a Tailwind layout switcher swapping to a bottom navigation tab bar (Documents, Viewer, Chat) under the `md` breakpoint.
  - Programmed navigation auto-switches when documents are selected (swaps to Viewer) or chat queries are submitted (swaps to Chat).
- **Result:** High-quality mobile UX for smartphone/tablet web access.

---

## 🔮 3. What Is Left (Future Roadmap)

To transition Luminary from a hardened developer release to an enterprise-grade cloud system, the following features are scheduled:

### Phase 1: Core Platform Enhancements
1. **Optical Character Recognition (OCR):** Integrate a local OCR pipeline (e.g., via `pytesseract` or `easyocr`) to enable search and chat features on scanned and image-only PDF uploads.

### Phase 2: Platform Porting
1. **Desktop Client (Tauri):** Package the frontend and embedding models into a local desktop application executing on Tauri for 100% offline, offline-model PDF interrogation.
2. **Mobile Client (React Native):** Create iOS and Android mobile wrappers for reviewing PDF insights on-the-go.

### Phase 3: Infrastructure Scaling
1. **Database Upgrade:** Move from a single SQLite file to a managed PostgreSQL cluster with pgvector for production scaling.
2. **Redis Rate Limiting & Session Storage:** Move the simple python-dictionary-based rate limiter to Redis to support distributed multi-node API scaling.
3. **Containerization & Deployment:** Write optimized production Dockerfiles and Compose templates for deploying to services like AWS, GCP, or Render.

---

## 🔍 4. Verification Check

- **Frontend Compilation:** Verified via `npx tsc --noEmit` with zero TypeScript errors.
- **PDF Viewer Fix (Latest):** Resolved the persistent `pdf.worker.min.js` CDN fetch failure by switching to Vite's local `new URL(import.meta.url)` worker resolution pattern. Removed conflicting top-level `pdfjs-dist@5.7.284` duplicate (react-pdf bundles its own `pdfjs-dist@5.4.296`). Cleared Vite dependency cache.
- **Active Servers:**
  - **Backend API:** FastAPI running at `http://localhost:8000/` — FAISS index loaded, Clerk JWT auth active, all routes responding `200 OK`.
  - **Frontend Client:** Vite v8 dev server running at `http://localhost:5173/` — clean startup with zero errors.
- **Last Verified:** 2026-05-23T22:15:00+05:30
