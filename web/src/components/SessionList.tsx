/** SessionList — chat session history from server, switch/delete. */
import { useEffect, useCallback } from 'react';
import { listSessions, deleteSession as delSession, getSessionMessages } from '../lib/api';
import { useStore } from '../store';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SessionList() {
  const sessions = useStore((s) => s.sessions);
  const setSessions = useStore((s) => s.setSessions);
  const current = useStore((s) => s.currentSession);
  const setSession = useStore((s) => s.setCurrentSession);
  const setMessages = useStore((s) => s.setMessages);
  const removeSession = useStore((s) => s.removeSession);

  const fetchSessions = useCallback(async () => {
    try { const r = await listSessions(); setSessions(r.sessions); } catch { /* silent */ }
  }, [setSessions]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const loadSession = async (id: string) => {
    const sess = sessions.find(s => s.id === id);
    if (!sess) return;
    setSession(sess);
    try { const r = await getSessionMessages(id); setMessages(r.messages); } catch { /* silent */ }
  };

  const handleDel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await delSession(id); removeSession(id); } catch { /* silent */ }
  };

  if (!sessions.length) return <p className="text-xs text-[var(--color-ink-faint)] text-center py-4">No sessions yet</p>;

  return (
    <div className="flex flex-col gap-0.5 p-1">
      {sessions.map((s) => (
        <div key={s.id} onClick={() => loadSession(s.id)}
          className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${current?.id === s.id ? 'bg-[var(--color-accent-dim)]' : 'hover:bg-[rgba(255,255,255,0.04)]'}`}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--color-ink)] truncate">{s.title}</p>
            <p className="text-xs text-[var(--color-ink-faint)]">{timeAgo(s.created_at)}</p>
          </div>
          <button onClick={(e) => handleDel(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-danger-dim)] transition-opacity duration-150">
            <svg className="w-3 h-3 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
