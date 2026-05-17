/* ── API Types ──────────────────────────────────────────────── */

export interface DocumentInfo {
  doc_id: string;
  filename: string;
  upload_time: string;
  page_count: number;
  chunk_count: number;
  file_size: number;
}

export interface DocumentListResponse {
  documents: DocumentInfo[];
  total: number;
}

export interface UploadResponse {
  doc_id: string;
  filename: string;
  chunk_count: number;
  page_count: number;
}

export interface DeleteResponse {
  message: string;
  doc_id: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface ChatRequest {
  query: string;
  doc_ids: string[];
  session_id: string;
}

export interface Citation {
  filename: string;
  page_number: number;
  chunk_text: string;
  relevance_score: number;
}

/* ── App State Types ────────────────────────────────────────── */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  doc_ids: string[];
  created_at: number;
  updated_at: number;
}

export type ViewTab = 'documents' | 'viewer' | 'chat';

/* ── SSE Event Types ────────────────────────────────────────── */

export interface SSETokenEvent {
  token: string;
}

export interface SSEDoneEvent {
  done: boolean;
}

export interface SSECitationEvent {
  citations: Citation[];
}

export interface SSEErrorEvent {
  error: string;
}

export type SSEEvent = SSETokenEvent | SSEDoneEvent | SSECitationEvent | SSEErrorEvent;
