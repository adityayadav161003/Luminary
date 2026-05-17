/**
 * Luminary Zustand store. Global state for docs, sessions, chat, viewer.
 */
import { create } from 'zustand';
import type { DocumentInfo, SessionInfo, MessageInfo, SourceRef, ViewTab } from './types';

interface LuminaryState {
  documents: DocumentInfo[];
  selectedDocIds: string[];
  currentSession: SessionInfo | null;
  messages: MessageInfo[];
  isStreaming: boolean;
  streamingContent: string;
  streamingCitations: SourceRef[];
  currentPage: number;
  totalPages: number;
  viewerDocId: string | null;
  viewerScale: number;
  activeTab: ViewTab;
  sessions: SessionInfo[];

  setDocuments: (docs: DocumentInfo[]) => void;
  addDocument: (doc: DocumentInfo) => void;
  removeDocument: (docId: string) => void;
  toggleDocSelection: (docId: string) => void;
  selectSingleDoc: (docId: string) => void;
  setCurrentSession: (session: SessionInfo | null) => void;
  setMessages: (msgs: MessageInfo[]) => void;
  addMessage: (msg: MessageInfo) => void;
  setStreaming: (v: boolean) => void;
  setStreamingContent: (v: string) => void;
  appendStreamToken: (token: string) => void;
  setStreamingCitations: (c: SourceRef[]) => void;
  finalizeStream: (sessionId: string) => void;
  jumpToPage: (page: number) => void;
  setTotalPages: (n: number) => void;
  setViewerDoc: (docId: string | null) => void;
  setViewerScale: (s: number) => void;
  setActiveTab: (tab: ViewTab) => void;
  setSessions: (sessions: SessionInfo[]) => void;
  removeSession: (id: string) => void;
}

export const useStore = create<LuminaryState>((set, get) => ({
  documents: [],
  selectedDocIds: [],
  currentSession: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  streamingCitations: [],
  currentPage: 1,
  totalPages: 0,
  viewerDocId: null,
  viewerScale: 1.0,
  activeTab: 'documents',
  sessions: [],

  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (docId) => set((s) => ({
    documents: s.documents.filter((d) => d.doc_id !== docId),
    selectedDocIds: s.selectedDocIds.filter((id) => id !== docId),
    viewerDocId: s.viewerDocId === docId ? null : s.viewerDocId,
  })),
  toggleDocSelection: (docId) => set((s) => ({
    selectedDocIds: s.selectedDocIds.includes(docId)
      ? s.selectedDocIds.filter((id) => id !== docId)
      : [...s.selectedDocIds, docId],
  })),
  selectSingleDoc: (docId) => set({ selectedDocIds: [docId] }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setStreaming: (v) => set({ isStreaming: v }),
  setStreamingContent: (v) => set({ streamingContent: v }),
  appendStreamToken: (token) => set((s) => ({ streamingContent: s.streamingContent + token })),
  setStreamingCitations: (c) => set({ streamingCitations: c }),
  finalizeStream: (_sessionId) => {
    const state = get();
    if (state.streamingContent) {
      const msg: MessageInfo = {
        id: crypto.randomUUID(), role: 'assistant', content: state.streamingContent,
        sources_json: state.streamingCitations.length > 0 ? state.streamingCitations : null,
        created_at: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, msg],
        isStreaming: false, streamingContent: '', streamingCitations: [],
        currentSession: s.currentSession ? { ...s.currentSession, message_count: s.messages.length + 1 } : s.currentSession,
      }));
    } else {
      set({ isStreaming: false, streamingContent: '', streamingCitations: [] });
    }
  },
  jumpToPage: (page) => set({ currentPage: page }),
  setTotalPages: (n) => set({ totalPages: n }),
  setViewerDoc: (docId) => set({ viewerDocId: docId, currentPage: 1 }),
  setViewerScale: (s) => set({ viewerScale: Math.max(0.5, Math.min(3, s)) }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSessions: (sessions) => set({ sessions }),
  removeSession: (id) => set((s) => ({
    sessions: s.sessions.filter((sess) => sess.id !== id),
    currentSession: s.currentSession?.id === id ? null : s.currentSession,
    messages: s.currentSession?.id === id ? [] : s.messages,
  })),
}));
