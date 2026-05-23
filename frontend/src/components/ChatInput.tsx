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
    if (!query || isStreaming) return;

    // Check if document context is attached
    if (selectedDocIds.length === 0) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Please select at least one document from the repository.', type: 'error' }
        })
      );
      return;
    }

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

  const triggerAttachInfo = () => {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { message: 'Toggle checkboxes in the Document Repository to attach context.', type: 'info' }
      })
    );
  };

  const triggerPrecisionMode = () => {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { message: 'Precision Mode enabled. Retrieval scope locked to exact citations.', type: 'success' }
      })
    );
  };

  const disabled = selectedDocIds.length === 0;

  return (
    <div className="p-xl pt-0 z-20 flex-shrink-0 bg-[#0A0B0D]">
      <div className="max-w-4xl mx-auto w-full">
        {disabled && (
          <div className="text-center mb-2.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-fixed-dim font-mono bg-primary-container/10 border border-primary-container/20 px-2.5 py-0.5 rounded-full">
              💡 Select a document checkbox in the repository to start chat
            </span>
          </div>
        )}

        <div className="relative group shimmer-focus bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl transition-all duration-300">
          {/* Action Toolbar Above Input */}
          <div className="flex items-center gap-md px-md py-xs border-b border-outline-variant/10">
            <button 
              type="button"
              onClick={triggerAttachInfo}
              className="flex items-center gap-xs text-[10px] font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">attachment</span>
              Attach Context
            </button>
            <button 
              type="button"
              onClick={triggerPrecisionMode}
              className="flex items-center gap-xs text-[10px] font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">model_training</span>
              Precision Mode
            </button>
            
            <div className="ml-auto flex items-center gap-xs">
              <span className="text-[10px] font-mono text-on-surface-variant opacity-50">Shift + Enter for new line</span>
            </div>
          </div>

          {/* Textarea Input Area */}
          <div className="flex items-end p-xs">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={isStreaming ? 'Luminary is thinking...' : 'Ask anything about your document...'}
              disabled={isStreaming}
              rows={2}
              maxLength={2000}
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-sans text-body-md py-sm px-md resize-none placeholder:text-on-surface-variant/40 outline-none"
            />
            
            <div className="pb-sm pr-sm">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={() => abortController?.abort()}
                  className="bg-error hover:brightness-110 active:scale-90 text-white h-10 w-10 rounded-lg flex items-center justify-center transition-all shadow-lg shadow-error/15 cursor-pointer flex-shrink-0"
                  title="Cancel Request"
                >
                  <span className="material-symbols-outlined text-[18px]">stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim()}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all shadow-lg flex-shrink-0 cursor-pointer
                    ${!input.trim() 
                      ? 'bg-surface-container-high text-on-surface-variant/20 cursor-not-allowed border border-outline-variant/10' 
                      : 'bg-primary-fixed-dim hover:brightness-110 active:scale-90 text-on-primary-fixed shadow-primary/10'}`}
                  title="Send message"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Gold Accent Line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-primary-fixed-dim/40 to-transparent"></div>
        </div>

        <div className="flex justify-center mt-4 gap-8">
          <div className="flex items-center gap-2 opacity-40">
            <span className="material-symbols-outlined text-[14px]">security</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2 opacity-40">
            <span className="material-symbols-outlined text-[14px]">memory</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">GPT-4 Turbo Context</span>
          </div>
        </div>
      </div>
    </div>
  );
}
