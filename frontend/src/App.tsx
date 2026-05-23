import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn, useAuth, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useStore } from './store';
import DropZone from './components/DropZone';
import DocumentList from './components/DocumentList';
import PDFViewer from './components/PDFViewer';
import ChatPanel from './components/ChatPanel';
import SessionSidebar from './components/SessionSidebar';
import LandingPage from './pages/LandingPage';
import SettingsPanel from './components/SettingsPanel';
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
  const createSession = useStore((s) => s.createSession);
  const { signOut } = useAuth();
  const { user } = useUser();

  const [activeView, setActiveView] = useState<'intelligence' | 'settings'>('intelligence');

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSignOut = () => {
    signOut();
  };

  const handleNewAnalysis = () => {
    createSession(selectedDocIds);
    setActiveView('intelligence');
  };

  const handleResetDocIdsSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearDocSelection();
    if (viewerDocId) {
      setViewerDoc(viewerDocId);
    }
  };

  const pdfUrl = useStore((state) => state.pdfUrls[state.selectedDocIds[0]]);
  const isDocSelected = !!pdfUrl;

  return (
    <div className="h-screen flex overflow-hidden bg-[#0A0B0D] font-sans">
      {/* ── Sidebar Navigation Shell ── */}
      <aside className="hidden md:flex h-screen w-64 flex-shrink-0 bg-surface-container border-r border-outline-variant/20 flex-col py-8 z-40">
        <div className="px-6 mb-8 text-left">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
            <span className="text-lg font-bold text-primary">Luminary</span>
          </div>
          <p className="text-xs uppercase tracking-wider text-on-surface-variant mt-1.5 opacity-60 font-semibold">Premium RAG Pipeline</p>
        </div>
        
        <nav className="flex-1 px-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveView('intelligence')}
            className={`flex items-center gap-3 px-4 py-2.5 hover:translate-x-1 transition-all duration-200 cursor-pointer text-left w-full rounded-md ${activeView === 'intelligence' ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined">psychology</span>
            <span className="text-xs uppercase tracking-wider font-semibold">Intelligence</span>
          </button>
          
          <button 
            onClick={() => setActiveView('intelligence')}
            className="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 hover:bg-surface-variant/50 hover:translate-x-1 transition-all duration-200 cursor-pointer text-left w-full rounded-md"
          >
            <span className="material-symbols-outlined">description</span>
            <span className="text-xs uppercase tracking-wider font-semibold">Documents</span>
          </button>
          
          <button 
            onClick={() => setActiveView('intelligence')}
            className="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 hover:bg-surface-variant/50 hover:translate-x-1 transition-all duration-200 cursor-pointer text-left w-full rounded-md"
          >
            <span className="material-symbols-outlined">history</span>
            <span className="text-xs uppercase tracking-wider font-semibold">History</span>
          </button>
          
          <button 
            onClick={() => setActiveView('settings')}
            className={`flex items-center gap-3 px-4 py-2.5 hover:translate-x-1 transition-all duration-200 cursor-pointer text-left w-full rounded-md ${activeView === 'settings' ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs uppercase tracking-wider font-semibold">Settings</span>
          </button>
        </nav>
        
        <div className="px-6 mt-auto flex flex-col gap-3 border-t border-outline-variant/10 pt-6">
          <button 
            onClick={handleNewAnalysis}
            className="w-full bg-primary-container text-on-primary-container font-bold py-3 px-4 rounded transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider shadow-lg shadow-primary-container/10"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Analysis
          </button>
          
          <div className="mt-6 flex flex-col gap-2">
            <a 
              href="https://fastapi.tiangolo.com" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 hover:text-primary transition-colors text-xs uppercase tracking-wider font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              Help
            </a>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 hover:text-error transition-colors text-xs uppercase tracking-wider font-semibold cursor-pointer text-left w-full rounded-md"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </div>
        </div>
      </aside>
 
      {/* ── Main Workspace Content Area ── */}
      <main className="flex-1 h-screen flex flex-col relative overflow-hidden md:ml-0">
        {/* Top Context Header */}
        <header className="h-16 flex items-center justify-between px-6 md:px-8 glass-panel bg-surface/60 border-b border-outline-variant/10 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-left">
              <h1 className="text-sm md:text-base font-bold text-on-surface tracking-tight">
                {activeView === 'intelligence' ? 'Active Workspace' : 'Account Settings'}
              </h1>
              <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-widest opacity-50">
                {activeView === 'intelligence' ? 'Cluster-04 // Neural-Link' : 'Luminary Profile // Configuration'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30">
              <div className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse"></div>
              <span className="text-[10px] text-primary-fixed-dim font-bold uppercase tracking-wider">Engine Ready</span>
            </div>
            {user && (
              <div 
                onClick={() => setActiveView('settings')}
                className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center border border-white/10 shadow-lg cursor-pointer text-[10px] font-bold text-on-primary-container"
                title="View Settings"
              >
                {user.firstName?.[0] || 'AD'}
              </div>
            )}
          </div>
        </header>
 
        {/* Dynamic Content Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === 'settings' ? (
            <SettingsPanel />
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Context Drawer (History/Docs) */}
              <aside className="hidden md:flex w-80 border-r border-outline-variant/10 bg-surface-container-low flex-col flex-shrink-0">
                <div className="p-6 border-b border-outline-variant/10">
                  <h2 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-4">Document Repository</h2>
                  <DropZone />
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col">
                  <div className="flex flex-col gap-2 flex-1 min-h-0">
                    <div className="flex items-center justify-between px-2 mb-1">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Recent Files</span>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant cursor-pointer hover:text-primary">filter_list</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto min-h-0">
                      <DocumentList />
                    </div>
 
                    <div className="border-t border-outline-variant/10 pt-2 min-h-[220px] flex-shrink-0 bg-surface-container-low">
                      <SessionSidebar />
                    </div>
                  </div>
                </div>
              </aside>

              {/* RAG Workspace Area (Chat & PDF side by side) */}
              <section className="flex-1 flex overflow-hidden relative bg-[#0A0B0D]">
                {/* Background Atmospheric Glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  <div className="orb-1 absolute -top-[10%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary-container/4 blur-[130px]" />
                  <div className="orb-2 absolute bottom-[10%] -left-[5%] w-[500px] h-[500px] rounded-full bg-primary-fixed-dim/2 blur-[120px]" />
                  <div 
                    className="absolute inset-0 opacity-40 transition-all duration-75"
                    style={{
                      background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(250, 189, 0, 0.08) 0%, transparent 45%)`
                    }}
                  />
                </div>

                <div className="flex-1 flex overflow-hidden relative z-10">
                  {isDocSelected ? (
                    <div className="flex-1 flex overflow-hidden">
                      {/* Left: PDF Viewer */}
                      <div className="flex-1 border-r border-outline-variant/10 overflow-hidden">
                        <PDFViewer />
                      </div>
                      {/* Right: Chat Panel */}
                      <div className="w-[420px] flex-shrink-0 overflow-hidden">
                        <ChatPanel />
                      </div>
                    </div>
                  ) : (
                    // Chat only (Full Width)
                    <div className="flex-1 overflow-hidden">
                      <ChatPanel />
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile Layout ── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* Brand / Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-[#0F1218] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">flare</span>
              Luminary
            </span>
          </div>
          {user && (
            <button 
              onClick={handleSignOut} 
              className="text-xs text-on-surface-variant hover:text-error transition-colors cursor-pointer font-semibold"
            >
              Sign out
            </button>
          )}
        </div>

        {/* Tab Viewport */}
        <div className="flex-grow overflow-hidden bg-[#0A0B0D]">
          {activeTab === 'documents' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="p-3 border-b border-outline-variant/10">
                <DropZone />
              </div>
              <div className="flex-1 overflow-y-auto">
                <DocumentList />
              </div>
              <div className="h-[180px] border-t border-outline-variant/10 bg-surface-container-low">
                <SessionSidebar />
              </div>
            </div>
          )}
          {activeTab === 'viewer' && <PDFViewer />}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col relative">
              {selectedDocIds.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/20 text-xs font-semibold text-white shadow-xl">
                    Chatting with {selectedDocIds.length} documents
                    <button 
                      onClick={handleResetDocIdsSelection}
                      className="ml-1 p-0.5 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-white transition-colors cursor-pointer"
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
        <nav className="flex border-t border-outline-variant/20 bg-surface-container pb-safe flex-shrink-0">
          {tabs.map((tab) => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key)} 
              className={`flex-grow flex flex-col items-center gap-1 py-2.5 transition-colors duration-150 cursor-pointer ${activeTab === tab.key ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function MainRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
      <Route 
        path="/sign-in/*" 
        element={
          <div className="min-h-screen flex flex-col bg-[#0A0B0D] text-[#e3e2e5] font-sans relative selection:bg-primary/30">
            {/* Header */}
            <header className="w-full border-b border-outline-variant/30 bg-surface/60 backdrop-blur-xl z-20">
              <div className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto h-16">
                <div 
                  className="text-lg font-bold text-primary-container tracking-tighter flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
                  Luminary
                </div>
                <button 
                  onClick={() => navigate('/')} 
                  className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all active:scale-95 cursor-pointer"
                >
                  Home
                </button>
              </div>
            </header>
            
            {/* Main Auth Card Area */}
            <main className="flex-1 relative flex items-center justify-center pt-16 pb-12 z-10 overflow-hidden">
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="ambient-glow-anim absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full"></div>
                <div className="ambient-glow-anim absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full" style={{ animationDelay: '-5s' }}></div>
              </div>
              <div className="relative z-10 w-full flex justify-center">
                <SignIn routing="path" path="/sign-in" forceRedirectUrl="/app" signUpUrl="/sign-up" />
              </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0A0B0D] border-t border-outline-variant/10 w-full py-4 z-20 text-center flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">verified_user</span>
              <span className="text-xs text-on-surface-variant font-medium">Secure AES-256 encrypted authentication</span>
            </footer>
          </div>
        } 
      />
      <Route 
        path="/sign-up/*" 
        element={
          <div className="min-h-screen flex flex-col bg-[#0A0B0D] text-[#e3e2e5] font-sans relative selection:bg-primary/30">
            {/* Header */}
            <header className="w-full border-b border-outline-variant/30 bg-surface/60 backdrop-blur-xl z-20">
              <div className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto h-16">
                <div 
                  className="text-lg font-bold text-primary-container tracking-tighter flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
                  Luminary
                </div>
                <button 
                  onClick={() => navigate('/')} 
                  className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all active:scale-95 cursor-pointer"
                >
                  Home
                </button>
              </div>
            </header>

            {/* Main Auth Card Area */}
            <main className="flex-1 relative flex items-center justify-center pt-16 pb-12 z-10 overflow-hidden">
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="ambient-glow-anim absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full"></div>
                <div className="ambient-glow-anim absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full" style={{ animationDelay: '-5s' }}></div>
              </div>
              <div className="relative z-10 w-full flex justify-center">
                <SignUp routing="path" path="/sign-up" forceRedirectUrl="/app" signInUrl="/sign-in" />
              </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0A0B0D] border-t border-outline-variant/10 w-full py-4 z-20 text-center flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">verified_user</span>
              <span className="text-xs text-on-surface-variant font-medium">Secure AES-256 encrypted authentication</span>
            </footer>
          </div>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
    <ClerkProvider 
      publishableKey={CLERK_KEY} 
      appearance={{ 
        baseTheme: dark,
        variables: {
          colorPrimary: '#fabd00',
          colorBackground: '#1f2022',
          colorText: '#e3e2e5',
          colorInputBackground: '#1b1c1e',
          colorInputText: '#e3e2e5',
          colorTextSecondary: '#d4c5ab',
          colorBorder: '#4f4632',
        }
      }}
    >
      <BrowserRouter>
        {toast && (
          <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-surface-container-high backdrop-blur-md shadow-2xl animate-fade-in border-[#EF4444]/30">
            <svg className="w-4 h-4 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="text-xs font-semibold text-[#e3e2e5]">{toast.message}</span>
          </div>
        )}
        <MainRoutes />
      </BrowserRouter>
    </ClerkProvider>
  );
}
