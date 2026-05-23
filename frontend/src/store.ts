/**
 * Luminary global state store — Zustand.
 * Manages documents, chat sessions, UI state.
 */

import { create } from 'zustand';
import type { DocumentInfo, ChatMessage, ChatSession, Citation, ViewTab } from './types';

function generateId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 15);
}

interface LuminaryStore {
  /* ── Documents ─────────────────────────────────────────── */
  documents: DocumentInfo[];
  selectedDocIds: string[];
  pdfUrls: Record<string, string>;
  setDocuments: (docs: DocumentInfo[]) => void;
  addDocument: (doc: DocumentInfo) => void;
  addPdfUrl: (docId: string, url: string) => void;
  removeDocument: (docId: string) => void;
  toggleDocSelection: (docId: string) => void;
  selectSingleDoc: (docId: string) => void;
  clearDocSelection: () => void;

  /* ── PDF Viewer ────────────────────────────────────────── */
  viewerDocId: string | null;
  viewerPage: number;
  currentPage: number;
  viewerTotalPages: number;
  viewerScale: number;
  highlightedPage: number | null;
  setViewerDoc: (docId: string | null, totalPages?: number) => void;
  setViewerPage: (page: number) => void;
  setViewerTotalPages: (total: number) => void;
  setViewerScale: (scale: number) => void;
  navigateToPage: (page: number) => void;
  jumpToPage: (page: number) => void;

  /* ── Chat Sessions ────────────────────────────────────── */
  sessions: ChatSession[];
  currentSessionId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  streamingCitations: Citation[];
  abortController: AbortController | null;
  setSessions: (sessions: ChatSession[]) => void;
  setSessionMessages: (sessionId: string, messages: ChatMessage[]) => void;

  createSession: (docIds: string[]) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setStreamingCitations: (citations: Citation[]) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamToken: (token: string) => void;
  setAbortController: (ac: AbortController | null) => void;
  finalizeStream: () => void;
  getCurrentSession: () => ChatSession | null;

  /* ── UI ────────────────────────────────────────────────── */
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const SESSIONS_KEY = 'luminary_sessions';

function loadSessions(): ChatSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChatSession[];
      return parsed.slice(0, 10); // Keep max 10
    }
  } catch {
    // Corrupted storage
  }
  return [];
}

function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 10)));
  } catch {
    // Storage full
  }
}

export const useStore = create<LuminaryStore>((set, get) => ({
  /* ── Documents ─────────────────────────────────────────── */
  documents: [],
  selectedDocIds: [],
  pdfUrls: {},

  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  addPdfUrl: (docId, url) => set((s) => ({ pdfUrls: { ...s.pdfUrls, [docId]: url } })),
  removeDocument: (docId) =>
    set((s) => {
      const url = s.pdfUrls[docId];
      if (url) {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      }
      const newUrls = { ...s.pdfUrls };
      delete newUrls[docId];
      return {
        documents: s.documents.filter((d) => d.doc_id !== docId),
        selectedDocIds: s.selectedDocIds.filter((id) => id !== docId),
        viewerDocId: s.viewerDocId === docId ? null : s.viewerDocId,
        pdfUrls: newUrls,
      };
    }),
  toggleDocSelection: (docId) =>
    set((s) => ({
      selectedDocIds: s.selectedDocIds.includes(docId)
        ? s.selectedDocIds.filter((id) => id !== docId)
        : [...s.selectedDocIds, docId],
    })),
  selectSingleDoc: (docId) => set({ selectedDocIds: [docId] }),
  clearDocSelection: () => set({ selectedDocIds: [] }),

  /* ── PDF Viewer ────────────────────────────────────────── */
  viewerDocId: null,
  viewerPage: 1,
  currentPage: 1,
  viewerTotalPages: 0,
  viewerScale: 1.0,
  highlightedPage: null,

  setViewerDoc: (docId, totalPages) =>
    set({ viewerDocId: docId, viewerPage: 1, currentPage: 1, viewerTotalPages: totalPages || 0 }),
  setViewerPage: (page) => set({ viewerPage: page, currentPage: page }),
  setViewerTotalPages: (total) => set({ viewerTotalPages: total }),
  setViewerScale: (scale) => set({ viewerScale: Math.max(0.5, Math.min(3, scale)) }),
  navigateToPage: (page) => set({ viewerPage: page, currentPage: page, highlightedPage: page }),
  jumpToPage: (page) => set({ viewerPage: page, currentPage: page, highlightedPage: page }),

  /* ── Chat Sessions ────────────────────────────────────── */
  sessions: loadSessions(),
  currentSessionId: null,
  isStreaming: false,
  streamingContent: '',
  streamingCitations: [],
  abortController: null,
  setSessions: (sessions) => set({ sessions }),
  setSessionMessages: (sessionId, messages) =>
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId ? { ...sess, messages } : sess
      ),
    })),
  setAbortController: (ac) => set({ abortController: ac }),

  createSession: (docIds) => {
    const id = generateId();
    const session: ChatSession = {
      id,
      title: 'New Chat',
      messages: [],
      doc_ids: docIds,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    set((s) => {
      const updated = [session, ...s.sessions].slice(0, 10);
      saveSessions(updated);
      return { sessions: updated, currentSessionId: id };
    });
    return id;
  },

  switchSession: (sessionId) => set({ currentSessionId: sessionId }),

  deleteSession: (sessionId) =>
    set((s) => {
      const updated = s.sessions.filter((sess) => sess.id !== sessionId);
      saveSessions(updated);
      return {
        sessions: updated,
        currentSessionId: s.currentSessionId === sessionId ? null : s.currentSessionId,
      };
    }),

  addMessage: (message) =>
    set((s) => {
      const sessions = s.sessions.map((sess) => {
        if (sess.id === s.currentSessionId) {
          const updated = {
            ...sess,
            messages: [...sess.messages, message],
            updated_at: Date.now(),
            title:
              sess.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 40) + (message.content.length > 40 ? '…' : '')
                : sess.title,
          };
          return updated;
        }
        return sess;
      });
      saveSessions(sessions);
      return { sessions };
    }),

  updateLastAssistantMessage: (content) =>
    set((s) => {
      const sessions = s.sessions.map((sess) => {
        if (sess.id === s.currentSessionId) {
          const msgs = [...sess.messages];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
            msgs[lastIdx] = { ...msgs[lastIdx], content };
          }
          return { ...sess, messages: msgs, updated_at: Date.now() };
        }
        return sess;
      });
      saveSessions(sessions);
      return { sessions };
    }),

  setStreamingCitations: (citations) => set({ streamingCitations: citations }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamToken: (token) =>
    set((s) => ({ streamingContent: s.streamingContent + token })),

  finalizeStream: () => {
    const state = get();
    if (state.streamingContent) {
      const msg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: state.streamingContent,
        citations: state.streamingCitations.length > 0 ? state.streamingCitations : undefined,
        timestamp: Date.now(),
      };
      state.addMessage(msg);
    }
    set({ isStreaming: false, streamingContent: '', streamingCitations: [] });
  },

  getCurrentSession: () => {
    const state = get();
    return state.sessions.find((s) => s.id === state.currentSessionId) || null;
  },

  /* ── UI ────────────────────────────────────────────────── */
  activeTab: 'documents',
  setActiveTab: (tab) => set({ activeTab: tab }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
