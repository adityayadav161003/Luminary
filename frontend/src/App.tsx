import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn, useAuth, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useStore } from './store';
import DropZone from './components/DropZone';
import DocumentList from './components/DocumentList';
import PDFViewer from './components/PDFViewer';
import ChatPanel from './components/ChatPanel';
import SessionSidebar from './components/SessionSidebar';
import LandingPage from './pages/LandingPage';
import type { ViewTab } from './types';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const tabs: { key: ViewTab; label: string; icon: string }[] = [
  { key: 'documents', label: 'Docs', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { key: 'viewer', label: 'View', icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z' },
  { key: 'chat', label: 'Chat', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z' },
];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
}

function ClerkMissing() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#080A0F] text-[#F0EDE8] font-sans">
      <div className="text-center px-8 animate-fade-in max-w-sm">
        <p className="text-[#EF4444] text-sm font-semibold mb-2">Clerk key missing</p>
        <p className="text-[#6B7280] text-xs leading-relaxed">
          Set <code className="px-1 py-0.5 rounded bg-white/[0.04] font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> in your <code className="px-1.5 py-0.5 rounded bg-white/[0.04] font-mono">.env</code> file. Get it from the Clerk Dashboard.
        </p>
      </div>
    </div>
  );
}

function Workspace() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const clearDocSelection = useStore((s) => s.clearDocSelection);
  const viewerDocId = useStore((s) => s.viewerDocId);
  const setViewerDoc = useStore((s) => s.setViewerDoc);
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = () => {
    signOut();
  };

  const handleResetDocIdsSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearDocSelection();
    if (viewerDocId) {
      setViewerDoc(viewerDocId);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#080A0F] font-sans">
      {/* ── Desktop Layout ──────────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0F1218]">
          {/* Logo Row */}
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#F0EDE8] tracking-wide">
                ✦ Luminary<span className="text-[#C8A84B] ml-0.5">.</span>
              </span>
            </div>
            {/* Status Chip */}
            <div className="mt-2 text-xs text-[#6B7280] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A84B]" />
              {selectedDocIds.length} doc{selectedDocIds.length !== 1 ? 's' : ''} active
            </div>
          </div>

          {/* DropZone component */}
          <DropZone />

          {/* DocumentList component */}
          <div className="flex-1 overflow-y-auto">
            <DocumentList />
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* Sessions Section */}
          <div className="h-[200px]">
            <SessionSidebar />
          </div>

          {/* Bottom user row */}
          {user && (
            <div className="border-t border-white/[0.06] p-3.5 flex items-center gap-2.5 bg-black/15">
              <div className="w-7 h-7 rounded-full bg-[#C8A84B]/20 text-[#C8A84B] flex items-center justify-center text-xs font-semibold">
                {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#F0EDE8] truncate">
                  {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}
                </p>
                <p className="text-[10px] text-[#6B7280] truncate">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              <button 
                onClick={handleSignOut} 
                className="text-[10px] font-bold text-[#6B7280] hover:text-[#EF4444] transition-colors duration-150 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}
        </aside>

        {/* Center Panel (PDF Viewer) */}
        <main className="flex-1 flex flex-col bg-[#080A0F] overflow-hidden">
          <PDFViewer />
        </main>

        {/* Right Panel (Chat Workspace) */}
        <aside className="w-[380px] flex-shrink-0 flex flex-col border-l border-white/[0.06] bg-[#0F1218]">
          <ChatPanel />
        </aside>
      </div>

      {/* ── Mobile Layout ───────────────────────────────────── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* Brand / Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0F1218]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#F0EDE8]">✦ Luminary<span className="text-[#C8A84B]">.</span></span>
          </div>
          {user && (
            <button 
              onClick={handleSignOut} 
              className="text-xs text-[#6B7280] hover:text-[#EF4444] transition-colors cursor-pointer"
            >
              Sign out
            </button>
          )}
        </div>

        {/* Tab Viewport */}
        <div className="flex-1 overflow-hidden bg-[#080A0F]">
          {activeTab === 'documents' && (
            <div className="h-full flex flex-col overflow-hidden">
              <DropZone />
              <div className="flex-1 overflow-y-auto">
                <DocumentList />
              </div>
              <div className="h-[180px] border-t border-white/[0.06]">
                <SessionSidebar />
              </div>
            </div>
          )}
          {activeTab === 'viewer' && <PDFViewer />}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col relative">
              {selectedDocIds.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161B24] border border-white/[0.08] text-xs font-semibold text-white shadow-xl">
                    Chatting with {selectedDocIds.length} documents
                    <button 
                      onClick={handleResetDocIdsSelection}
                      className="ml-1 p-0.5 rounded-full hover:bg-white/10 text-[#6B7280] hover:text-white transition-colors cursor-pointer"
                      title="Reset selections"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <ChatPanel />
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <nav className="flex border-t border-white/[0.06] bg-[#0F1218] pb-safe">
          {tabs.map((tab) => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key)} 
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors duration-150 cursor-pointer ${activeTab === tab.key ? 'text-[#C8A84B] font-semibold' : 'text-[#6B7280]'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    const handleRateLimit = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const resetAt = detail?.resetAt;
      let message = "Daily limit reached.";
      if (resetAt) {
        try {
          const localTime = new Date(resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          message = `Daily limit reached. Resets at ${localTime}`;
        } catch {
          // ignore
        }
      }
      setToast({ message, type: 'error' });
    };

    const handleToastEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setToast({ message: detail.message || '', type: detail.type || 'error' });
    };

    window.addEventListener('rate-limit', handleRateLimit);
    window.addEventListener('toast', handleToastEvent);

    return () => {
      window.removeEventListener('rate-limit', handleRateLimit);
      window.removeEventListener('toast', handleToastEvent);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!CLERK_KEY) {
    return <ClerkMissing />;
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY} appearance={{ baseTheme: dark }}>
      <BrowserRouter>
        {toast && (
          <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-[#161B24] backdrop-blur-md shadow-2xl animate-fade-in border-[#EF4444]/30">
            <svg className="w-4 h-4 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="text-xs font-semibold text-[#F0EDE8]">{toast.message}</span>
          </div>
        )}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
          <Route 
            path="/sign-in/*" 
            element={
              <div className="h-screen flex items-center justify-center bg-[#080A0F]">
                <SignIn routing="path" path="/sign-in" forceRedirectUrl="/app" signUpUrl="/sign-up" />
              </div>
            } 
          />
          <Route 
            path="/sign-up/*" 
            element={
              <div className="h-screen flex items-center justify-center bg-[#080A0F]">
                <SignUp routing="path" path="/sign-up" forceRedirectUrl="/app" signInUrl="/sign-in" />
              </div>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}


