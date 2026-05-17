/** ChatPanel — message thread + streaming + citation chips. */
import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import type { SourceRef } from '../types';
import ChatInput from './ChatInput';

function Citations({ sources, onCite }: { sources: SourceRef[]; onCite: (p: number) => void }) {
  if (!sources.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {sources.map((s, i) => (
        <button key={i} onClick={() => onCite(s.page_number)} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)] hover:bg-[var(--color-accent-border)] transition-colors duration-150 font-[var(--font-mono)]">
          {s.filename} · p.{s.page_number}
        </button>
      ))}
    </div>
  );
}

export default function ChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = useStore((s) => s.messages);
  const isStreaming = useStore((s) => s.isStreaming);
  const streamingContent = useStore((s) => s.streamingContent);
  const streamingCitations = useStore((s) => s.streamingCitations);
  const session = useStore((s) => s.currentSession);
  const jump = useStore((s) => s.jumpToPage);
  const setTab = useStore((s) => s.setActiveTab);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages.length, streamingContent]);

  const cite = (p: number) => { jump(p); setTab('viewer'); };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Chat</h2>
        {session && <span className="text-xs text-[var(--color-ink-faint)] truncate max-w-[160px]">{session.title}</span>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <p className="text-sm text-[var(--color-ink-muted)]">Ask anything about your selected documents.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 ${m.role === 'user' ? 'bg-[var(--color-accent-dim)] border border-[var(--color-accent-border)]' : 'bg-[var(--color-surface-2)]'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.role === 'assistant' && m.sources_json && <Citations sources={m.sources_json} onCite={cite} />}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start animate-slide-up">
            <div className="max-w-[85%] rounded-xl px-4 py-3 bg-[var(--color-surface-2)]">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {streamingContent}<span className="inline-block w-0.5 h-4 ml-0.5 bg-[var(--color-accent)] animate-cursor" />
              </p>
              {streamingCitations.length > 0 && <Citations sources={streamingCitations} onCite={cite} />}
            </div>
          </div>
        )}
      </div>

      <ChatInput />
    </div>
  );
}
