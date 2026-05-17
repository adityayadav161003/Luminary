/** ChatInput — auto-resize textarea, Enter send, Shift+Enter newline, cancel button, char counter. */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { streamChat } from '../lib/api';
import type { SSEEvent, MessageInfo } from '../types';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selected = useStore((s) => s.selectedDocIds);
  const isStreaming = useStore((s) => s.isStreaming);
  const session = useStore((s) => s.currentSession);
  const addMessage = useStore((s) => s.addMessage);
  const setStreaming = useStore((s) => s.setStreaming);
  const setStreamingContent = useStore((s) => s.setStreamingContent);
  const appendToken = useStore((s) => s.appendStreamToken);
  const setCitations = useStore((s) => s.setStreamingCitations);
  const finalizeStream = useStore((s) => s.finalizeStream);
  const setCurrentSession = useStore((s) => s.setCurrentSession);

  useEffect(() => { const t = taRef.current; if (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; } }, [input]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || !selected.length || isStreaming) return;

    const userMsg: MessageInfo = { id: crypto.randomUUID(), role: 'user', content: q, sources_json: null, created_at: new Date().toISOString() };
    addMessage(userMsg);
    setInput('');
    setStreaming(true);
    setStreamingContent('');

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let sessionId = session?.id || null;

    try {
      await streamChat(
        { query: q, doc_ids: selected, session_id: sessionId },
        (e: SSEEvent) => {
          if ('citations' in e && 'session_id' in e) {
            setCitations(e.citations);
            sessionId = e.session_id;
            if (!session) setCurrentSession({ id: e.session_id, title: q.slice(0, 60), created_at: new Date().toISOString(), message_count: 1 });
          }
          else if ('token' in e) appendToken(e.token);
          else if ('error' in e) appendToken(`\n\n⚠️ ${e.error}`);
        },
        ctrl.signal,
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') appendToken(`\n\n⚠️ ${(err as Error).message}`);
    } finally {
      finalizeStream(sessionId || '');
      abortRef.current = null;
    }
  }, [input, selected, isStreaming, session, addMessage, setStreaming, setStreamingContent, appendToken, setCitations, finalizeStream, setCurrentSession]);

  const disabled = !selected.length;
  const showCounter = input.length > 1800;

  return (
    <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-surface-1)]">
      {selected.length > 1 && <p className="text-xs text-[var(--color-accent)] mb-1.5">{selected.length} docs selected</p>}
      {disabled && <p className="text-xs text-[var(--color-ink-faint)] mb-1.5 text-center">Select a document to start chatting</p>}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea ref={taRef} value={input} onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={isStreaming ? 'Luminary is thinking...' : disabled ? 'Select a document first…' : 'Ask about your documents…'}
            disabled={disabled || isStreaming} rows={1}
            className="w-full resize-none bg-[var(--color-surface-2)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 transition-colors duration-150" style={{ minHeight: '44px' }} />
          {showCounter && <span className="absolute bottom-1.5 right-2 text-xs text-[var(--color-ink-faint)]">{input.length} / 2000</span>}
        </div>
        {isStreaming ? (
          <button onClick={() => abortRef.current?.abort()} className="flex-shrink-0 p-2.5 rounded-lg bg-[var(--color-danger-dim)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/25 transition-colors duration-150">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        ) : (
          <button onClick={send} disabled={disabled || !input.trim()} className="flex-shrink-0 p-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-surface)] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
