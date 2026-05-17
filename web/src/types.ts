/* All TypeScript types for Luminary. No `any` types anywhere. */

export interface DocumentInfo {
  doc_id: string;
  filename: string;
  upload_time: string;
  page_count: number;
  chunk_count: number;
  file_size_bytes: number;
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

export interface SessionInfo {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

export interface SessionListResponse {
  sessions: SessionInfo[];
}

export interface SourceRef {
  filename: string;
  page_number: number;
  chunk_text: string;
  relevance_score: number;
}

export interface MessageInfo {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources_json: SourceRef[] | null;
  created_at: string;
}

export interface MessageListResponse {
  messages: MessageInfo[];
  session_id: string;
}

export interface ChatRequest {
  query: string;
  doc_ids: string[];
  session_id: string | null;
}

export interface SSETokenEvent { token: string; }
export interface SSEDoneEvent { done: boolean; }
export interface SSECitationEvent { citations: SourceRef[]; session_id: string; }
export interface SSEErrorEvent { error: string; }
export type SSEEvent = SSETokenEvent | SSEDoneEvent | SSECitationEvent | SSEErrorEvent;

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export type ViewTab = 'documents' | 'viewer' | 'chat';
