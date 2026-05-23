# Luminary Desktop — Tauri + React

> **Phase 2 — Scaffold Only. Full implementation pending.**

## Architecture

The desktop app is Luminary's **privacy differentiator**. All PDF processing runs locally:

- **PDF parsing** — PyMuPDF bundled as a Tauri sidecar binary
- **Embeddings** — `all-MiniLM-L6-v2` ONNX model runs on-device
- **Vector index** — FAISS index stored at:
  - macOS: `~/Library/Application Support/Luminary/`
  - Windows: `%APPDATA%\Luminary\`
  - Linux: `~/.local/share/Luminary/`

### What leaves the device

| Data | Transmitted? |
|------|-------------|
| PDF bytes | **NEVER** — parsed and embedded locally |
| Chunk embeddings | **NEVER** — stored in local FAISS index |
| Query text | ✅ Sent to OpenRouter for LLM completion |
| JWT token | ✅ Sent for user authentication |

### Setup (when implemented)

```bash
# Prerequisites: Rust toolchain, Node.js 18+
npm install
npx tauri init
npx tauri dev
```

### Frontend

Reuses `../frontend/src` React components via symlink or shared package. The same Zustand store, API layer, and UI components are used — only the API transport layer is swapped to use Tauri IPC instead of HTTP fetch.

### Backend Sidecar

A Python sidecar bundled with the app handles:
1. PDF parsing (PyMuPDF)
2. Local embedding (sentence-transformers)
3. FAISS indexing and search
4. OpenRouter streaming (only query text transmitted)

The sidecar communicates with the Tauri frontend via stdout/stdin JSON-RPC.
