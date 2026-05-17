/**
 * ChatInput — Auto-resizing textarea with send/cancel controls.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { streamChat } from '../api';
import type { SSEEvent, ChatMessage } from '../types';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const isStreaming = useStore((s) => s.isStreaming);
  const currentSessionId = useStore((s) => s.currentSessionId);
  const createSession = useStore((s) => s.createSession);
  const addMessage = useStore((s) => s.addMessage);
  const setStreaming = useStore((s) => s.setStreaming);
  const setStreamingContent = useStore((s) => s.setStreamingContent);
  const appendStreamToken = useStore((s) => s.appendStreamToken);
  const setStreamingCitations = useStore((s) => s.setStreamingCitations);
  const finalizeStream = useStore((s) => s.finalizeStream);

  // Auto-resize
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; }
  }, [input]);

  const send = useCallback(async () => {
    const query = input.trim();
    if (!query || selectedDocIds.length === 0 || isStreaming) return;

    let sessionId = currentSessionId;
    if (!sessionId) { sessionId = createSession(selectedDocIds); }

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: query, timestamp: Date.now() };
    addMessage(userMsg);
    setInput('');
    setStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        { query, doc_ids: selectedDocIds, session_id: sessionId },
        (event: SSEEvent) => {
          if ('citations' in event) { setStreamingCitations(event.citations); }
          else if ('token' in event) { appendStreamToken(event.token); }
          else if ('done' in event) { /* stream done */ }
          else if ('error' in event) { appendStreamToken(`\n\n⚠️ ${event.error}`); }
        },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        appendStreamToken(`\n\n⚠️ ${(err as Error).message}`);
      }
    } finally {
      finalizeStream();
      abortRef.current = null;
    }
  }, [input, selectedDocIds, isStreaming, currentSessionId, createSession, addMessage, setStreaming, setStreamingContent, appendStreamToken, setStreamingCitations, finalizeStream]);

  const cancel = () => { abortRef.current?.abort(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const disabled = selectedDocIds.length === 0;

  return (
    <div className="border-t border-[var(--color-border-default)] p-3 bg-[var(--color-bg-secondary)]">
      {disabled && (
        <p className="text-xs text-[var(--color-text-muted)] mb-2 text-center">
          Select a document to start chatting
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Select a document first…' : 'Ask about your documents…'}
          disabled={disabled || isStreaming}
          rows={1}
          className="flex-1 resize-none bg-[var(--color-bg-tertiary)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 transition-colors duration-150"
        />
        {isStreaming ? (
          <button onClick={cancel} className="flex-shrink-0 p-2 rounded-lg bg-[var(--color-danger-dim)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/30 transition-colors duration-150" title="Cancel">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        ) : (
          <button onClick={send} disabled={disabled || !input.trim()} className="flex-shrink-0 p-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150" title="Send">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
