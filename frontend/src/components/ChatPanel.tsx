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
          className="px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/30 text-[11px] text-on-surface-variant hover:text-primary-fixed-dim hover:border-primary-fixed-dim/30 cursor-pointer transition-colors duration-150 font-semibold"
        >
          <span className="material-symbols-outlined text-[10px] mr-1 align-middle">menu_book</span>
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
    <div className="flex flex-col h-full bg-[#0A0B0D]">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-lg py-3 border-b border-outline-variant/10 bg-[#0A0B0D] flex-shrink-0">
        <div className="flex items-center gap-xs">
          <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse" />
          <span className="text-body-md font-bold text-on-surface">Intelligence Session</span>
        </div>
        {session && (
          <span className="text-[10px] font-mono px-sm py-0.5 rounded bg-surface-container border border-outline-variant/20 text-on-surface-variant truncate max-w-[200px]">
            {session.title}
          </span>
        )}
      </div>

      {/* Messages Scroll Container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-lg py-lg space-y-lg custom-scrollbar">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col gap-md items-start group animate-fade-in text-left">
            <div className="w-10 h-10 rounded bg-surface-container border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary-fixed-dim text-headline-sm" style={{ fontVariationSettings: "'FILL' 0" }}>smart_toy</span>
            </div>
            <div className="flex flex-col gap-xs max-w-2xl">
              <div className="flex items-center gap-sm">
                <span className="text-label-caps font-bold text-primary-container">Luminary AI</span>
                <span className="text-[10px] text-on-surface-variant font-mono">SYSTEM v4.0.2</span>
              </div>
              <div className="text-body-lg text-on-surface leading-relaxed">
                Welcome to your secure intelligence workspace. I am ready to analyze your datasets and provide high-fidelity insights.
                <br /><br />
                Please check the document repository on the left and type a message below to begin our RAG-enhanced consultation.
              </div>
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const showCursor = isStreaming && idx === messages.length - 1 && msg.role === 'assistant';
          
          if (isUser) {
            return (
              <div key={msg.id} className="flex gap-md items-start group justify-end animate-fade-in">
                <div className="flex flex-col gap-xs max-w-2xl text-right">
                  <div className="flex items-center gap-sm justify-end">
                    <span className="text-label-caps font-bold text-primary">You</span>
                    <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">User</span>
                  </div>
                  <div className="text-body-lg text-on-surface leading-relaxed bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-lg break-words text-left">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="flex gap-md items-start group animate-fade-in text-left">
                <div className="w-10 h-10 rounded bg-surface-container border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-headline-sm">smart_toy</span>
                </div>
                <div className="flex flex-col gap-xs max-w-2xl">
                  <div className="flex items-center gap-sm">
                    <span className="text-label-caps font-bold text-primary-container">Luminary AI</span>
                    <span className="text-[10px] text-on-surface-variant font-mono">SYSTEM v4.0.2</span>
                  </div>
                  <div className="text-body-lg text-on-surface leading-relaxed">
                    <p className="whitespace-pre-wrap">
                      {msg.content}
                      {showCursor && <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 align-middle cursor-blink" />}
                    </p>
                    {msg.citations && (
                      <CitationChips 
                        citations={msg.citations} 
                        onCitationClick={handleCitationClick} 
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          }
        })}

        {/* Sync Indicator */}
        <div className="pt-xl flex flex-col items-center opacity-25">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-outline-variant to-transparent mb-lg"></div>
          <p className="text-label-caps tracking-[0.2em] font-semibold uppercase">Context Synchronized</p>
        </div>
      </div>

      {/* Input panel */}
      <ChatInput />
    </div>
  );
}
