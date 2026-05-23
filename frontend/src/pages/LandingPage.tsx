import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] animate-fade-in text-[var(--color-text-primary)] font-sans">
      {/* Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between border-b border-[var(--color-border-default)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center shadow-[0_0_12px_rgba(226,177,60,0.2)]">
            <svg className="w-4 h-4 text-[#0A0B0F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <span className="text-base font-extrabold tracking-wide font-title">Luminary</span>
        </div>
        <button 
          onClick={() => navigate('/sign-in')} 
          className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-white transition-colors duration-150 cursor-pointer"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto py-16 md:py-24">
        <h1 className="text-4xl md:text-[64px] font-extrabold leading-tight tracking-tight mb-6 font-title bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
          Chat with your documents.<br />
          <span className="text-[var(--color-accent)] shadow-sm">Privately.</span>
        </h1>
        <p className="text-base md:text-lg text-[var(--color-text-secondary)] mb-10 max-w-xl leading-relaxed">
          Upload any PDF and extract immediate intelligence. Our privacy-first model ensures files are processed purely in-memory.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <button 
            onClick={() => navigate('/sign-up')} 
            className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-[#0A0B0F] font-bold hover:shadow-[0_4px_20px_rgba(226,177,60,0.3)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Start free — web app
          </button>
          <button 
            disabled 
            title="Desktop app coming soon" 
            className="px-6 py-3 rounded-xl border border-[var(--color-border-default)] text-[var(--color-text-muted)] cursor-not-allowed opacity-50 transition-colors duration-200"
          >
            Download desktop app
          </button>
        </div>

        {/* Privacy pills */}
        <div className="flex flex-wrap gap-2.5 justify-center mb-20">
          {['Zero Document Retention', 'Local Embeddings', 'Enterprise Auth Gate'].map((t) => (
            <span key={t} className="px-3.5 py-1 text-xs rounded-full border border-white/[0.04] bg-white/[0.01] text-[var(--color-text-muted)] font-mono">{t}</span>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {[
            { title: 'Instant answers', desc: 'Ask questions, get cited answers with page references.' },
            { title: 'Multi-document', desc: 'Compare contracts, research across multiple files at once.' },
            { title: 'Privacy first', desc: 'Desktop app processes everything locally. We never see your files.' },
          ].map((c) => (
            <div 
              key={c.title} 
              className="glass-surface hover:translate-y-[-2px] hover:border-white/[0.12] transition-all duration-300 rounded-2xl p-6 text-left shadow-lg border border-white/[0.04]"
            >
              <h3 className="text-base font-bold text-white mb-2 font-title">{c.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-8 border-t border-[var(--color-border-default)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div>© 2026 Luminary. Built with care.</div>
        <div className="flex gap-4">
          <a href="https://clerk.dev" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Auth</a>
          <a href="https://fastapi.tiangolo.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">API Docs</a>
        </div>
      </footer>
    </div>
  );
}
