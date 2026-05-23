/**
 * ChatPanel — message thread with streaming support and citation chips.
 * Revamped with clean dark-glass bubbles and golden highlights.
 */

import { useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useStore } from '../store';
import type { Citation } from '../types';
import ChatInput from './ChatInput';

function CitationChips({ citations, onCitationClick }: { citations: Citation[]; onCitationClick: (c: Citation) => void }) {
  if (!citations || !citations.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {citations.map((c, i) => (
        <button 
          key={i} 
          onClick={() => onCitationClick(c)} 
          className="px-2 py-1 rounded-md bg-[#1E2530] border border-white/[0.08] text-[11px] text-[#6B7280] hover:text-[#C8A84B] hover:border-[#C8A84B]/30 cursor-pointer transition-colors duration-150"
        >
          {c.filename} · Page {c.page_number}
        </button>
      ))}
    </div>
  );
}

export default function ChatPanel() {
  const { getToken } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentSessionId = useStore((s) => s.currentSessionId);
  const sessions = useStore((s) => s.sessions);
  const isStreaming = useStore((s) => s.isStreaming);
  const setStreaming = useStore((s) => s.setStreaming);
  
  const setAbortController = useStore((s) => s.setAbortController);
  const setSessionMessages = useStore((s) => s.setSessionMessages);
  const jumpToPage = useStore((s) => s.jumpToPage);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const selectedDocIds = useStore((s) => s.selectedDocIds);

  const session = sessions.find((s) => s.id === currentSessionId);
  const messages = session?.messages || [];

  const lastUserMsgIdRef = useRef<string>('');

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (isStreaming && lastMsg && lastMsg.role === 'user' && lastMsg.id !== lastUserMsgIdRef.current) {
      lastUserMsgIdRef.current = lastMsg.id;
      runStream(lastMsg.content);
    }
  }, [messages, isStreaming]);

  const runStream = async (query: string) => {
    const token = await getToken();
    const sessionId = currentSessionId;
    if (!sessionId) return;

    // Create an empty assistant message first
    const assistantMsgId = crypto.randomUUID();
    const initialMessages = [
      ...messages,
      {
        id: assistantMsgId,
        role: 'assistant' as const,
        content: '',
        timestamp: Date.now()
      }
    ];
    setSessionMessages(sessionId, initialMessages);

    const controller = new AbortController();
    setAbortController(controller);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ query, doc_ids: selectedDocIds, session_id: sessionId }),
        signal: controller.signal
      });

      if (response.status === 429) {
        try {
          const body = await response.json();
          window.dispatchEvent(new CustomEvent('rate-limit', { detail: { resetAt: body.reset_at } }));
        } catch {
          window.dispatchEvent(new CustomEvent('rate-limit', { detail: { resetAt: '' } }));
        }
        throw new Error("Rate limit exceeded");
      }

      if (!response.ok) throw new Error("Chat stream request failed");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let collectedText = '';
      let citations: Citation[] = [];

      const appendToken = (t: string) => {
        collectedText += t;
        setSessionMessages(sessionId, [
          ...initialMessages.slice(0, -1),
          {
            id: assistantMsgId,
            role: 'assistant' as const,
            content: collectedText,
            timestamp: Date.now()
          }
        ]);
      };

      const setSources = (srcs: any[]) => {
        citations = srcs.map((s: any) => ({
          filename: s.filename,
          page_number: s.page,
          chunk_text: '',
          relevance_score: 0
        }));
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) appendToken(parsed.token);
              if (parsed.sources) setSources(parsed.sources);
            } catch {}
          }
        }
      }

      setSessionMessages(sessionId, [
        ...initialMessages.slice(0, -1),
        {
          id: assistantMsgId,
          role: 'assistant' as const,
          content: collectedText,
          citations: citations.length > 0 ? citations : undefined,
          timestamp: Date.now()
        }
      ]);

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        setSessionMessages(sessionId, [
          ...initialMessages.slice(0, -1),
          {
            id: assistantMsgId,
            role: 'assistant' as const,
            content: `⚠️ Failed to get response: ${errMsg}`,
            timestamp: Date.now()
          }
        ]);
      }
    } finally {
      setStreaming(false);
      setAbortController(null);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, isStreaming]);

  const handleCitationClick = (c: Citation) => {
    jumpToPage(c.page_number);
    setActiveTab('viewer');
  };

  return (
    <div className="flex flex-col h-full bg-[#0F1218]">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#0F1218] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#F0EDE8]">Intelligence Workspace</span>
        </div>
        {session && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-[#6B7280] truncate max-w-[150px]">
            {session.title}
          </span>
        )}
      </div>

      {/* Messages Scroll Container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center animate-fade-in">
            <svg className="w-8 h-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <p className="text-sm font-semibold text-[#374151]">Ask anything about your documents</p>
            <p className="text-xs text-[#374151]">Select one or more PDFs from the sidebar</p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const showCursor = isStreaming && idx === messages.length - 1 && msg.role === 'assistant';
          
          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end animate-fade-in">
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-[#C8A84B]/[0.12] border border-[#C8A84B]/[0.18] text-[13px] text-[#F0EDE8] leading-relaxed break-words">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="flex justify-start gap-2.5 animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-[#C8A84B]/20 flex items-center justify-center flex-shrink-0 select-none">
                  <span className="text-[#C8A84B] text-[10px]">✦</span>
                </div>
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-[#161B24] border border-white/[0.06] text-[13px] text-[#F0EDE8] leading-relaxed break-words">
                  <p className="whitespace-pre-wrap">
                    {msg.content}
                    {showCursor && <span className="inline-block w-0.5 h-3.5 bg-[#C8A84B] ml-0.5 align-middle cursor-blink" />}
                  </p>
                  {msg.citations && (
                    <CitationChips 
                      citations={msg.citations} 
                      onCitationClick={handleCitationClick} 
                    />
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Input panel */}
      <ChatInput />
    </div>
  );
}
