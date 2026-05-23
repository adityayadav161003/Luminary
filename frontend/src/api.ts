/**
 * Luminary API client — typed fetch wrappers with token injection and error handling.
 */

import type {
  DocumentListResponse,
  UploadResponse,
  DeleteResponse,
  HealthResponse,
  ChatRequest,
  SSEEvent,
  SessionListResponse,
  MessageListResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export function createApiClient(getToken: () => Promise<string | null>) {
  const getAuthToken = async () => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  };

  const handleResponse = async (res: Response) => {
    if (res.status === 429) {
      try {
        const body = await res.json();
        const resetAt = body.reset_at || '';
        window.dispatchEvent(new CustomEvent('rate-limit', { detail: { resetAt } }));
      } catch {
        window.dispatchEvent(new CustomEvent('rate-limit', { detail: { resetAt: '' } }));
      }
      throw new Error("Rate limit exceeded");
    }
    return res;
  };

  return {
    async checkHealth(): Promise<HealthResponse> {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Backend unreachable');
      return res.json();
    },

    async listDocuments(): Promise<DocumentListResponse> {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await handleResponse(res);
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },

    async deleteDocument(docId: string): Promise<DeleteResponse> {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await handleResponse(res);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Delete failed' }));
        throw new Error(err.detail || 'Delete failed');
      }
      return res.json();
    },

    uploadDocument(
      file: File,
      onProgress: (progress: UploadProgress) => void,
    ): Promise<UploadResponse> {
      return new Promise(async (resolve, reject) => {
        try {
          const token = await getAuthToken();
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append('file', file);

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              onProgress({
                loaded: e.loaded,
                total: e.total,
                percent: Math.round((e.loaded / e.total) * 100),
              });
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 429) {
              try {
                const body = JSON.parse(xhr.responseText);
                const resetAt = body.reset_at || '';
                window.dispatchEvent(new CustomEvent('rate-limit', { detail: { resetAt } }));
              } catch {
                window.dispatchEvent(new CustomEvent('rate-limit', { detail: { resetAt: '' } }));
              }
              reject(new Error("Rate limit exceeded"));
              return;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error('Invalid response from server'));
              }
            } else {
              try {
                const err = JSON.parse(xhr.responseText);
                reject(new Error(err.detail || `Upload failed (${xhr.status})`));
              } catch {
                reject(new Error(`Upload failed (${xhr.status})`));
              }
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

          xhr.open('POST', `${API_BASE}/upload`);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        } catch (e) {
          reject(e);
        }
      });
    },

    async listSessions(): Promise<SessionListResponse> {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await handleResponse(res);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },

    async getSessionMessages(sessionId: string): Promise<MessageListResponse> {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await handleResponse(res);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },

    async deleteSession(sessionId: string): Promise<DeleteResponse> {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await handleResponse(res);
      if (!res.ok) throw new Error('Failed to delete session');
      return res.json();
    },

    async streamChat(
      request: ChatRequest,
      onEvent: (event: SSEEvent) => void,
      signal?: AbortSignal,
    ): Promise<void> {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request),
        signal,
      });

      await handleResponse(res);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Chat request failed' }));
        throw new Error(err.detail || 'Chat request failed');
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
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') {
              onEvent({ done: true });
              break;
            }
            try {
              const event: SSEEvent = JSON.parse(jsonStr);
              onEvent(event);
            } catch {
              // Skip
            }
          }
        }
      }
    }
  };
}
