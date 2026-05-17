/** Landing page — privacy-first hero + feature cards. */
export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-[var(--color-surface)] animate-fade-in">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-[56px] font-bold leading-tight tracking-tight text-[var(--color-ink)] mb-5">
          Chat with your documents.<br />
          <span className="text-[var(--color-accent)]">Privately.</span>
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-ink-muted)] mb-8 max-w-xl">
          Upload a PDF and ask anything. Desktop and mobile apps keep your files entirely on your device.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <a href="/sign-up" className="px-6 py-3 rounded-lg border-2 border-[var(--color-accent)] text-[var(--color-accent)] font-semibold hover:bg-[var(--color-accent-dim)] transition-colors duration-150">
            Start free — web app
          </a>
          <button disabled title="Coming soon" className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)] cursor-not-allowed opacity-50">
            Download desktop app
          </button>
        </div>

        {/* Privacy pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-16">
          {['No data sold', 'Files encrypted in transit', 'Desktop: files never leave your device'].map((t) => (
            <span key={t} className="px-3 py-1 text-xs rounded-full border border-[var(--color-border)] text-[var(--color-ink-muted)]">{t}</span>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
          {[
            { title: 'Instant answers', desc: 'Ask questions, get cited answers with page references.' },
            { title: 'Multi-document', desc: 'Compare contracts, research across multiple files at once.' },
            { title: 'Privacy first', desc: 'Desktop app processes everything locally. We never see your files.' },
          ].map((c) => (
            <div key={c.title} className="glass rounded-2xl p-6 text-left animate-slide-up">
              <h3 className="text-base font-semibold text-[var(--color-ink)] mb-2">{c.title}</h3>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-[var(--color-ink-faint)]">
        © 2025 Luminary · Made with care
      </footer>
    </div>
  );
}
