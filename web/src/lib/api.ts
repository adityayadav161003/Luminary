/**
 * Luminary API client. All calls attach Clerk JWT via getToken().
 * SSE uses fetch + ReadableStream (not EventSource, which can't set headers).
 * PDF bytes are uploaded to the server for web processing; desktop keeps them local.
 */

import type {
  DocumentListResponse, UploadResponse, UploadProgress,
  SessionListResponse, MessageListResponse, ChatRequest, SSEEvent,
} from '../types';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type TokenGetter = () => Promise<string | null>;

let _getToken: TokenGetter = async () => null;

export function setTokenGetter(fn: TokenGetter): void {
  _getToken = fn;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await _getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = { ...await authHeaders(), ...init?.headers } as Record<string, string>;
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `Request failed (${res.status})` }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  return res;
}

// ── Documents ───────────────────────────────────────────────
export async function listDocuments(): Promise<DocumentListResponse> {
  return (await apiFetch('/documents')).json();
}

export async function deleteDocument(docId: string): Promise<void> {
  await apiFetch(`/documents/${docId}`, { method: 'DELETE' });
}

export function uploadDocument(file: File, onProgress: (p: UploadProgress) => void): Promise<UploadResponse> {
  return new Promise(async (resolve, reject) => {
    const token = await _getToken();
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress({ loaded: e.loaded, total: e.total, percent: Math.round((e.loaded / e.total) * 100) });
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('Bad response')); }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText).detail)); } catch { reject(new Error(`Upload failed (${xhr.status})`)); }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('POST', `${API}/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(form);
  });
}

// ── Sessions ────────────────────────────────────────────────
export async function listSessions(): Promise<SessionListResponse> {
  return (await apiFetch('/sessions')).json();
}

export async function getSessionMessages(sessionId: string): Promise<MessageListResponse> {
  return (await apiFetch(`/sessions/${sessionId}/messages`)).json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiFetch(`/sessions/${sessionId}`, { method: 'DELETE' });
}

// ── Chat SSE ────────────────────────────────────────────────
export async function streamChat(
  request: ChatRequest,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers = { 'Content-Type': 'application/json', ...await authHeaders() };
  const res = await fetch(`${API}/chat`, {
    method: 'POST', headers, body: JSON.stringify(request), signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Chat failed' }));
    throw new Error(err.detail || 'Chat failed');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try { onEvent(JSON.parse(trimmed.slice(6))); } catch { /* skip malformed */ }
      }
    }
  }
}
