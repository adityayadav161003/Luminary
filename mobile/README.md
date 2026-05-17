# Luminary Mobile — React Native (Expo)

> **Phase 2 — Scaffold Only. Full implementation pending.**

## Architecture

The Android app is Luminary's **mobile privacy story**. All PDF processing runs on-device:

- **PDF parsing** — Custom Expo native module using Android PDFRenderer
- **Embeddings** — On-device ONNX model (MiniLM, quantized to ~22MB) via `onnxruntime-react-native`
- **Vector index** — FAISS-mobile or custom cosine similarity search
- **Storage** — PDF stored in app sandbox (`FileSystem.documentDirectory`)

### What leaves the device

| Data | Transmitted? |
|------|-------------|
| PDF bytes | **NEVER** — parsed and embedded on-device |
| Chunk embeddings | **NEVER** — stored in app sandbox |
| Query text | ✅ Sent to OpenRouter for LLM completion |
| JWT token | ✅ Sent for user authentication |

### Setup (when implemented)

```bash
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install expo-document-picker expo-file-system onnxruntime-react-native
npx expo run:android
```

### Key Dependencies (planned)

- `expo-document-picker` — PDF file selection
- `expo-file-system` — Secure local storage
- `onnxruntime-react-native` — On-device MiniLM inference
- `@clerk/clerk-expo` — Authentication
- `react-native-pdf` — PDF rendering

### Authentication

Uses `@clerk/clerk-expo` with the same Clerk instance as the web app. Users have a single account across all platforms.
