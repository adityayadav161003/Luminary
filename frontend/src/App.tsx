import { useStore } from './store';
import DropZone from './components/DropZone';
import DocumentList from './components/DocumentList';
import PDFViewer from './components/PDFViewer';
import ChatPanel from './components/ChatPanel';
import SessionSidebar from './components/SessionSidebar';
import type { ViewTab } from './types';

const tabs: { key: ViewTab; label: string; icon: string }[] = [
  { key: 'documents', label: 'Docs', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { key: 'viewer', label: 'View', icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z' },
  { key: 'chat', label: 'Chat', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z' },
];

export default function App() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const selectedDocIds = useStore((s) => s.selectedDocIds);

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] animate-fade-in">
      {/* ── Desktop Layout ──────────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[260px] flex-shrink-0 flex flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
          {/* Brand */}
          <div className="px-4 py-4 border-b border-[var(--color-border-default)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--color-bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
              </div>
              <span className="text-base font-semibold text-[var(--color-text-primary)] tracking-tight">Luminary</span>
            </div>
            {selectedDocIds.length > 0 && (
              <p className="text-xs text-[var(--color-accent)] mt-2">{selectedDocIds.length} doc{selectedDocIds.length > 1 ? 's' : ''} selected for chat</p>
            )}
          </div>

          {/* Upload */}
          <div className="p-3">
            <DropZone />
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto">
            <DocumentList />
          </div>

          {/* Sessions */}
          <div className="h-[200px] border-t border-[var(--color-border-default)]">
            <SessionSidebar />
          </div>
        </aside>

        {/* Center: PDF Viewer */}
        <main className="flex-1 overflow-hidden">
          <PDFViewer />
        </main>

        {/* Right: Chat */}
        <aside className="w-[380px] flex-shrink-0 border-l border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
          <ChatPanel />
        </aside>
      </div>

      {/* ── Mobile Layout ───────────────────────────────────── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
          <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[var(--color-bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Luminary</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'documents' && (
            <div className="h-full overflow-y-auto">
              <div className="p-3"><DropZone /></div>
              <DocumentList />
            </div>
          )}
          {activeTab === 'viewer' && <PDFViewer />}
          {activeTab === 'chat' && <ChatPanel />}
        </div>

        {/* Bottom tabs */}
        <nav className="flex border-t border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors duration-150 ${activeTab === tab.key ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
