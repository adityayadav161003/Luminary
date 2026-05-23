/**
 * ChatInput — Auto-resizing textarea with send/cancel controls.
 * Features character counter and thinking state.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import type { ChatMessage } from '../types';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const isStreaming = useStore((s) => s.isStreaming);
  const currentSessionId = useStore((s) => s.currentSessionId);
  const createSession = useStore((s) => s.createSession);
  const addMessage = useStore((s) => s.addMessage);
  const setStreaming = useStore((s) => s.setStreaming);
  const abortController = useStore((s) => s.abortController);
  const setActiveTab = useStore((s) => s.setActiveTab);

  // Auto-resize textarea height
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const send = useCallback(async () => {
    const query = input.trim();
    if (!query || selectedDocIds.length === 0 || isStreaming) return;

    setActiveTab('chat');

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createSession(selectedDocIds);
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInput('');
    setStreaming(true);
  }, [input, selectedDocIds, isStreaming, currentSessionId, createSession, addMessage, setStreaming, setActiveTab]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  const disabled = selectedDocIds.length === 0;

  return (
    <div className="px-3 pb-3 pt-2 border-t border-white/[0.06] bg-[#0F1218]">
      {disabled && (
        <div className="text-center mb-2">
          <span className="inline-block text-[10px] font-semibold text-[#C8A84B] font-mono bg-[#C8A84B]/10 border border-[#C8A84B]/20 px-2 py-0.5 rounded-full">
            💡 Check a document checkbox on the left to start chat
          </span>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2.5 rounded-xl bg-[#161B24] border border-white/[0.08] focus-within:border-white/[0.16] transition-colors duration-150 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={isStreaming ? 'Luminary is thinking...' : disabled ? 'Select a document first…' : 'Ask anything about your documents…'}
          disabled={disabled || isStreaming}
          rows={1}
          maxLength={2000}
          className="flex-1 bg-transparent resize-none outline-none text-[13px] text-[#F0EDE8] placeholder:text-[#374151] min-h-[20px] max-h-[120px] leading-relaxed font-sans"
        />

        {input.length > 1500 && (
          <div className={`text-[10px] self-end mb-1.5 mr-1 font-mono ${input.length > 1900 ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
            {input.length} / 2000
          </div>
        )}

        {isStreaming ? (
          <button
            onClick={() => abortController?.abort()}
            className="w-7 h-7 rounded-lg bg-[#EF4444] hover:bg-[#F87171] flex items-center justify-center transition-colors duration-150 flex-shrink-0 self-end mb-0.5 cursor-pointer"
            title="Cancel request"
          >
            {/* Square/stop icon */}
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1.5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={send}
            disabled={disabled || !input.trim()}
            className={`
              w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 flex-shrink-0 self-end mb-0.5 cursor-pointer
              ${disabled || !input.trim()
                ? 'bg-white/[0.02] text-[#374151] cursor-not-allowed'
                : 'bg-[#C8A84B] hover:bg-[#D4B55A] text-[#080A0F]'}
            `}
            title="Send Query"
          >
            {/* Arrow Up icon */}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
