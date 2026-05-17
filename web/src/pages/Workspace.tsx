/** Workspace — three-panel layout (desktop) / bottom-tab layout (mobile). */
import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { setTokenGetter } from '../lib/api';
import { useStore } from '../store';
import DropZone from '../components/DropZone';
import DocumentList from '../components/DocumentList';
import SessionList from '../components/SessionList';
import PDFViewer from '../components/PDFViewer';
import ChatPanel from '../components/ChatPanel';
import type { ViewTab } from '../types';

const tabs: { id: ViewTab; icon: string; label: string }[] = [
  { id: 'documents', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', label: 'Docs' },
  { id: 'viewer', icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'View' },
  { id: 'chat', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', label: 'Chat' },
];

export default function Workspace() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const tab = useStore((s) => s.activeTab);
  const setTab = useStore((s) => s.setActiveTab);
  const setSession = useStore((s) => s.setCurrentSession);
  const setMsgs = useStore((s) => s.setMessages);
  const setStreamContent = useStore((s) => s.setStreamingContent);

  useEffect(() => { setTokenGetter(getToken); }, [getToken]);

  const newChat = () => { setSession(null); setMsgs([]); setStreamContent(''); };

  return (
    <div className="h-screen flex flex-col bg-[var(--color-surface)] animate-fade-in">
      {/* Desktop 3-panel */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-1)] flex flex-col overflow-hidden">
          <div className="p-4 flex items-center gap-2">
            <span className="text-base font-bold text-[var(--color-accent)]">◆</span>
            <span className="text-sm font-semibold text-[var(--color-ink)]">Luminary</span>
          </div>
          <div className="px-3 pb-2"><span className="text-xs font-semibold text-[var(--color-ink-faint)] uppercase tracking-wider">Documents</span></div>
          <div className="px-3 pb-3"><DropZone /></div>
          <div className="flex-1 overflow-y-auto"><DocumentList /></div>
          <div className="border-t border-[var(--color-border)]">
            <div className="px-3 pt-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-ink-faint)] uppercase tracking-wider">Sessions</span>
              <button onClick={newChat} className="text-xs text-[var(--color-accent)] hover:underline">+ New</button>
            </div>
            <div className="max-h-48 overflow-y-auto"><SessionList /></div>
          </div>
          {user && (
            <div className="border-t border-[var(--color-border)] p-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-xs font-semibold text-[var(--color-accent)]">{user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || '?'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-ink)] truncate">{user.emailAddresses[0]?.emailAddress || ''}</p>
              </div>
              <button onClick={() => signOut()} className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] transition-colors duration-150">Sign out</button>
            </div>
          )}
        </aside>

        {/* Center — Viewer */}
        <main className="flex-1 overflow-hidden"><PDFViewer /></main>

        {/* Right — Chat */}
        <div className="w-96 flex-shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface-1)]"><ChatPanel /></div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col flex-1 md:hidden overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {tab === 'documents' && (
            <div className="h-full flex flex-col overflow-y-auto">
              <div className="p-4 flex items-center gap-2 border-b border-[var(--color-border)]">
                <span className="text-base font-bold text-[var(--color-accent)]">◆</span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">Luminary</span>
              </div>
              <div className="p-3"><DropZone /></div>
              <DocumentList />
              <div className="border-t border-[var(--color-border)] p-3"><span className="text-xs font-semibold text-[var(--color-ink-faint)] uppercase">Sessions</span></div>
              <SessionList />
            </div>
          )}
          {tab === 'viewer' && <PDFViewer />}
          {tab === 'chat' && <ChatPanel />}
        </div>
        <nav className="flex border-t border-[var(--color-border)] bg-[var(--color-surface-1)]">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors duration-150 ${tab === t.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-faint)]'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={t.icon} /></svg>
              <span className="text-[10px]">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
