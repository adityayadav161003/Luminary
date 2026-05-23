/**
 * SessionSidebar — stores and manages chat sessions via the backend API.
 * Features active indicators, deletion capabilities, and clean empty states.
 */

import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useStore } from '../store';
import { createApiClient } from '../api';
import type { ChatSession, ChatMessage, SessionInfo, MessageInfo } from '../types';

function getRelativeTimeShort(timestamp: number): string {
  const elapsed = timestamp - Date.now();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' });
  const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
    { unit: 'day', ms: 86400000 },
    { unit: 'hour', ms: 3600000 },
    { unit: 'minute', ms: 60000 }
  ];

  for (const { unit, ms } of units) {
    if (Math.abs(elapsed) >= ms) {
      return rtf.format(Math.round(elapsed / ms), unit);
    }
  }
  return 'now';
}

export default function SessionSidebar() {
  const { getToken } = useAuth();
  const api = createApiClient(getToken);

  const sessions = useStore((s) => s.sessions);
  const setSessions = useStore((s) => s.setSessions);
  const currentSessionId = useStore((s) => s.currentSessionId);
  const switchSession = useStore((s) => s.switchSession);
  const setSessionMessages = useStore((s) => s.setSessionMessages);
  const selectedDocIds = useStore((s) => s.selectedDocIds);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await api.listSessions();
        const mapped: ChatSession[] = res.sessions.map((s: SessionInfo) => ({
          id: s.id,
          title: s.title || 'New Chat',
          messages: [],
          doc_ids: [],
          created_at: new Date(s.created_at).getTime(),
          updated_at: new Date(s.created_at).getTime()
        }));
        setSessions(mapped);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    };
    loadSessions();
  }, [setSessions]);

  const handleSessionClick = async (sessionId: string) => {
    switchSession(sessionId);
    try {
      const res = await api.getSessionMessages(sessionId);
      const mappedMsgs: ChatMessage[] = res.messages.map((m: MessageInfo) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.sources_json ? m.sources_json.map((s: any) => ({
          filename: s.filename,
          page_number: s.page_number,
          chunk_text: s.chunk_text || '',
          relevance_score: s.relevance_score || 0
        })) : undefined,
        timestamp: new Date(m.created_at).getTime()
      }));
      setSessionMessages(sessionId, mappedMsgs);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteSession(sessionId);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      
      if (currentSessionId === sessionId) {
        if (updated.length > 0) {
          handleSessionClick(updated[0].id);
        } else {
          // If no sessions remain, create a new one
          const newId = crypto.randomUUID();
          const newSess: ChatSession = {
            id: newId,
            title: 'New Chat',
            messages: [],
            doc_ids: selectedDocIds,
            created_at: Date.now(),
            updated_at: Date.now()
          };
          setSessions([newSess]);
          switchSession(newId);
          setSessionMessages(newId, []);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleNewSession = () => {
    const newId = crypto.randomUUID();
    const newSess: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [],
      doc_ids: selectedDocIds,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    setSessions([newSess, ...sessions]);
    switchSession(newId);
    setSessionMessages(newId, []);
  };

  const getSessionDisplayTitle = (s: ChatSession) => {
    const firstUserMsg = s.messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      return firstUserMsg.content.slice(0, 55) + (firstUserMsg.content.length > 55 ? '…' : '');
    }
    if (s.title && s.title !== 'New Chat') {
      return s.title.slice(0, 55) + (s.title.length > 55 ? '…' : '');
    }
    return 'New session';
  };

  return (
    <div className="flex flex-col h-full bg-[#0F1218]">
      {/* Section header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
        <span className="text-[10px] font-semibold text-[#374151] tracking-widest uppercase">Sessions</span>
        <button 
          onClick={handleNewSession} 
          className="text-[11px] text-[#6B7280] hover:text-[#C8A84B] transition-colors px-1.5 py-0.5 rounded cursor-pointer font-medium"
        >
          + New
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
        {sessions.length === 0 ? (
          <div className="text-[11px] text-[#374151] px-3 py-4 text-center italic">
            No sessions yet
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = currentSessionId === s.id;
            return (
              <div 
                key={s.id} 
                onClick={() => handleSessionClick(s.id)} 
                className={`
                  px-3 py-2 mx-1.5 rounded-lg cursor-pointer flex items-center justify-between gap-2 group transition-colors duration-150
                  ${isActive 
                    ? 'bg-[#C8A84B]/[0.06] text-[#C8A84B]' 
                    : 'hover:bg-white/[0.04] text-[#F0EDE8]'}
                `}
              >
                <div className="min-w-0 flex-1 flex flex-col">
                  <span className={`text-[12px] truncate font-medium ${isActive ? 'text-[#C8A84B]' : 'text-[#F0EDE8] group-hover:text-white'}`}>
                    {getSessionDisplayTitle(s)}
                  </span>
                  <span className="text-[10px] text-[#374151] mt-0.5">
                    {getRelativeTimeShort(s.created_at)}
                  </span>
                </div>
                
                {/* Delete button — show on hover only */}
                <button 
                  onClick={(e) => handleDeleteSession(s.id, e)} 
                  className="opacity-0 group-hover:opacity-100 text-[#374151] hover:text-[#EF4444] transition-colors duration-150 cursor-pointer p-0.5 text-xs font-bold"
                  title="Delete session"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
