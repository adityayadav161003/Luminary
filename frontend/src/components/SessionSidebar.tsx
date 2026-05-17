/**
 * SessionSidebar — stores last 10 chat sessions in localStorage.
 */
import { useStore } from '../store';

export default function SessionSidebar() {
  const sessions = useStore((s) => s.sessions);
  const currentSessionId = useStore((s) => s.currentSessionId);
  const switchSession = useStore((s) => s.switchSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const createSession = useStore((s) => s.createSession);
  const selectedDocIds = useStore((s) => s.selectedDocIds);

  const handleNew = () => {
    if (selectedDocIds.length > 0) createSession(selectedDocIds);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-default)]">
        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Sessions</span>
        <button onClick={handleNew} disabled={selectedDocIds.length === 0} className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] disabled:opacity-30 transition-colors duration-150">+ New</button>
      </div>
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {sessions.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-4">No sessions yet</p>
        )}
        {sessions.map((s) => (
          <div key={s.id} onClick={() => switchSession(s.id)} className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${currentSessionId === s.id ? 'bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20' : 'hover:bg-[var(--color-surface-hover)]'}`}>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{s.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{s.messages.length} messages</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-danger-dim)] transition-all duration-150">
              <svg className="w-3 h-3 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
