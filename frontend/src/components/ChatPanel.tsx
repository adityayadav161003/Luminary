/**
 * ChatPanel — message thread with streaming support and citation chips.
 */
import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import type { Citation } from '../types';
import ChatInput from './ChatInput';

function CitationChips({ citations, onCitationClick }: { citations: Citation[]; onCitationClick: (c: Citation) => void }) {
  if (!citations.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {citations.map((c, i) => (
        <button key={i} onClick={() => onCitationClick(c)} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors duration-150 font-[var(--font-mono)]">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          {c.filename} · Page {c.page_number}
        </button>
      ))}
    </div>
  );
}

export default function ChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentSessionId = useStore((s) => s.currentSessionId);
  const sessions = useStore((s) => s.sessions);
  const isStreaming = useStore((s) => s.isStreaming);
  const streamingContent = useStore((s) => s.streamingContent);
  const streamingCitations = useStore((s) => s.streamingCitations);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const session = sessions.find((s) => s.id === currentSessionId);
  const messages = session?.messages || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  const handleCitationClick = (c: Citation) => {
    navigateToPage(c.page_number);
    setActiveTab('viewer');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Chat</h2>
        {session && <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[180px]">{session.title}</span>}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-dim)] flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">Ask anything about your documents</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Select documents from the sidebar first</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 ${msg.role === 'user' ? 'bg-[var(--color-accent-dim)] text-[var(--color-text-primary)] border border-[var(--color-accent)]/20' : 'glass-surface'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.role === 'assistant' && msg.citations && (
                <CitationChips citations={msg.citations} onCitationClick={handleCitationClick} />
              )}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[85%] rounded-xl px-4 py-3 glass-surface">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {streamingContent}
                <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--color-accent)] rounded-sm animate-cursor-pulse" />
              </p>
              {streamingCitations.length > 0 && (
                <CitationChips citations={streamingCitations} onCitationClick={handleCitationClick} />
              )}
            </div>
          </div>
        )}
      </div>

      <ChatInput />
    </div>
  );
}
