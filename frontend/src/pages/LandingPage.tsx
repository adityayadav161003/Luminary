import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const solutionsRef = useRef<HTMLElement>(null);
  const securityRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/app');
    } else {
      navigate('/sign-in');
    }
  };

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('translate-y-0', 'opacity-100');
            entry.target.classList.remove('translate-y-10', 'opacity-0');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = document.querySelectorAll('.bento-reveal');
    cards.forEach((card) => {
      card.classList.add('transition-all', 'duration-700', 'translate-y-10', 'opacity-0');
      observer.observe(card);
    });

    return () => {
      cards.forEach((card) => observer.unobserve(card));
    };
  }, []);

  return (
    <div className="bg-[#0A0B0D] text-[#e3e2e5] font-sans selection:bg-primary-container/30 min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-outline-variant/30 bg-surface/60">
        <div className="flex justify-between items-center w-full px-gutter max-w-7xl mx-auto h-16">
          <div className="text-headline-sm font-bold text-primary-container tracking-tighter flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
            Luminary
          </div>
          <div className="hidden md:flex items-center gap-lg">
            <button 
              onClick={() => scrollTo(solutionsRef)} 
              className="text-on-surface-variant hover:text-on-surface transition-colors text-body-md font-medium cursor-pointer"
            >
              Solutions
            </button>
            <button 
              onClick={() => scrollTo(securityRef)} 
              className="text-on-surface-variant hover:text-on-surface transition-colors text-body-md font-medium cursor-pointer"
            >
              Security
            </button>
            <button 
              onClick={() => scrollTo(pricingRef)} 
              className="text-on-surface-variant hover:text-on-surface transition-colors text-body-md font-medium cursor-pointer"
            >
              Pricing
            </button>
          </div>
          <div className="flex items-center gap-md">
            <button 
              onClick={handleGetStarted}
              className="text-on-surface-variant hover:text-on-surface transition-colors text-body-md font-medium cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={handleGetStarted}
              className="bg-primary-container text-on-primary-container px-md py-xs rounded-lg font-bold text-body-md hover:brightness-110 transition-all active:scale-95 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="mesh-gradient min-h-screen pt-16 flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-xl pb-24 px-margin-page">
          {/* Background Atmospheric Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary-container/5 blur-[120px]"></div>
            <div className="absolute bottom-[10%] -left-[5%] w-[400px] h-[400px] rounded-full bg-primary-fixed-dim/3 blur-[100px]"></div>
          </div>

          <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
            <div className="inline-flex items-center gap-xs px-sm py-1 rounded-full border border-outline-variant/30 bg-surface-container-low mb-md">
              <span className="material-symbols-outlined text-primary-container text-[14px]">bolt</span>
              <span className="text-label-caps font-semibold text-primary-container">Now in Private Beta</span>
            </div>
            <h1 className="text-display-lg md:text-[72px] md:leading-[1.1] text-on-surface mb-md tracking-tight max-w-4xl font-bold">
              Chat with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-fixed-dim">your knowledge.</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mb-xl">
              Secure, private document analysis powered by advanced RAG pipelines. We process your data in memory—never saving a single byte to our servers.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-md w-full sm:w-auto">
              <button 
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-xl py-md bg-primary-container text-on-primary-container font-bold rounded-lg hover:brightness-110 transition-all active:scale-95 text-body-lg shadow-[0_0_40px_rgba(250,189,0,0.15)] cursor-pointer"
              >
                Get Started Free
              </button>
              <button 
                onClick={() => scrollTo(solutionsRef)}
                className="w-full sm:w-auto px-xl py-md border border-outline text-on-surface font-semibold rounded-lg hover:bg-surface-variant/20 transition-all text-body-lg cursor-pointer"
              >
                Explore Features
              </button>
            </div>

            {/* Abstract UI Preview */}
            <div className="mt-24 w-full max-w-5xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-container/20 to-transparent blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative backdrop-blur-xl bg-surface-container/60 border border-outline-variant/30 rounded-xl overflow-hidden shadow-2xl">
                <div className="h-10 bg-surface-container border-b border-outline-variant/20 flex items-center px-md gap-xs">
                  <div className="w-3 h-3 rounded-full bg-error/40"></div>
                  <div className="w-3 h-3 rounded-full bg-primary-fixed-dim/40"></div>
                  <div className="w-3 h-3 rounded-full bg-secondary/40"></div>
                </div>
                <img 
                  className="w-full object-cover opacity-90 h-[500px]" 
                  alt="A sophisticated dark-themed user interface showing a document analysis dashboard with abstract golden data visualizations, glowing text highlights, and minimalist chat windows. The aesthetic is professional and technical, featuring deep obsidian backgrounds and sharp amber accents that suggest high-precision artificial intelligence and secure data processing environments." 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjvBh4ZjGXpkAa2phxQ_J2IbatftB5i08wxo5sAc1hj6mj--GTG5sXwGNSVtM9kbUppeJ8EsS72H-kePZcRJJp_rhqBrMHsXwd6kZPK-2yiIYnwcd0JL2ld2OMXWd7XgLKH4KlEM74TF6vllb-hvCmCofOPCsNJ6PUKsg8BcL2qwiazj8m1sPi9axAtwleLwya-d3BOr2AkvEuqSx237wbeb7-yweiTh3cxCQSj1tmYmmo_dIQ5MyYkBUzj89mig2psyohPFQx7Q"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section - Bento Grid */}
        <section ref={solutionsRef} className="py-24 px-margin-page bg-[#0A0B0D] border-t border-outline-variant/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-md">
              <div className="max-w-xl">
                <h2 className="text-label-caps font-bold text-primary-container mb-sm uppercase tracking-widest">Architecture</h2>
                <h3 className="text-[40px] leading-tight text-on-surface font-bold">The Intelligence Workspace.</h3>
              </div>
              <p className="text-on-surface-variant max-w-md text-body-md leading-relaxed">
                Luminary transforms static documents into a dynamic conversation partner using our proprietary context injection engine.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {/* Bento Card 1 */}
              <div className="bento-reveal md:col-span-2 p-xl bg-surface-container rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col justify-between group min-h-[320px]">
                <div>
                  <span className="material-symbols-outlined text-primary-container text-[32px] mb-md" style={{ fontVariationSettings: "'FILL' 0" }}>upload_file</span>
                  <h4 className="text-headline-sm text-on-surface font-bold mb-sm">Instant Indexing</h4>
                  <p className="text-on-surface-variant max-w-sm text-body-md">Drag and drop your PDFs, Markdown, or JSON. Our pipeline parses and vectorizes data in milliseconds.</p>
                </div>
                <div className="mt-md flex gap-xs">
                  <div className="h-1 w-12 bg-primary rounded-full"></div>
                  <div className="h-1 w-6 bg-outline-variant rounded-full"></div>
                  <div className="h-1 w-6 bg-outline-variant rounded-full"></div>
                </div>
              </div>
              {/* Bento Card 2 */}
              <div className="bento-reveal p-xl bg-surface-container rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col justify-center items-center text-center group">
                <div className="relative w-24 h-24 mb-md flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:scale-125 transition-transform"></div>
                  <span className="material-symbols-outlined text-primary-container text-[48px] relative z-10" style={{ fontVariationSettings: "'FILL' 0" }}>psychology</span>
                </div>
                <h4 className="text-headline-sm text-on-surface font-bold mb-sm">Neural Retrieval</h4>
                <p className="text-on-surface-variant text-body-md">Advanced semantic search ensures only relevant context reaches the LLM.</p>
              </div>
              {/* Bento Card 3 */}
              <div className="bento-reveal p-xl bg-surface-container rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col group justify-between min-h-[240px]">
                <div>
                  <span className="material-symbols-outlined text-primary-container text-[32px] mb-md" style={{ fontVariationSettings: "'FILL' 0" }}>encrypted</span>
                  <h4 className="text-headline-sm text-on-surface font-bold mb-sm">No Persistence</h4>
                  <p className="text-on-surface-variant text-body-md">Your files are shredded and wiped from memory the moment your session ends.</p>
                </div>
              </div>
              {/* Bento Card 4 */}
              <div className="bento-reveal md:col-span-2 p-xl bg-surface-container rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col md:flex-row items-center gap-xl group overflow-hidden">
                <div className="flex-grow">
                  <h4 className="text-headline-sm text-on-surface font-bold mb-sm">Context-Aware Chat</h4>
                  <p className="text-on-surface-variant text-body-md">Ask complex questions about cross-document relationships and get cited, factual answers based only on your data.</p>
                </div>
                <div className="flex-1 w-full bg-[#0d0e10] p-md rounded-lg border border-outline-variant/20 font-mono text-[13px] text-on-surface-variant">
                  <div className="flex items-center gap-xs mb-xs text-primary/70">
                    <span className="w-2 h-2 rounded-full bg-primary/70"></span>
                    query_intelligence.log
                  </div>
                  <div className="opacity-60">&gt; Analyzing vector_space...</div>
                  <div className="text-primary">&gt; Found 12 matching nodes.</div>
                  <div className="opacity-60">&gt; Synthesizing response...</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security First Section */}
        <section ref={securityRef} className="py-24 px-margin-page bg-[#0A0B0D] border-t border-outline-variant/10">
          <div className="max-w-7xl mx-auto backdrop-blur-xl bg-surface-container/60 p-xl md:p-32 rounded-3xl border border-outline-variant/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-container/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl items-center relative z-10">
              <div>
                <h2 className="text-label-caps font-bold text-primary-container mb-sm uppercase tracking-widest">Security Standards</h2>
                <h3 className="text-[48px] leading-tight text-on-surface font-bold mb-md">Privacy is not a feature, <br />it's our foundation.</h3>
                <p className="text-on-surface-variant text-body-lg mb-xl max-w-lg">
                  We use zero-trust architecture and client-side encryption for all document processing. Luminary never trains on your data, and we never store your uploads.
                </p>
                <ul className="space-y-md">
                  <li className="flex items-start gap-md">
                    <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 0" }}>verified_user</span>
                    <div>
                      <h5 className="font-bold text-on-surface text-body-lg">SOC2 Type II Compliant</h5>
                      <p className="text-on-surface-variant text-body-md">Enterprise-grade security infrastructure for sensitive data.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-md">
                    <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 0" }}>lock_reset</span>
                    <div>
                      <h5 className="font-bold text-on-surface text-body-lg">AES-256 Encryption</h5>
                      <p className="text-on-surface-variant text-body-md">Data is encrypted at rest and in transit with the highest standards.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-square bg-surface-container-high rounded-2xl overflow-hidden border border-outline-variant/30 group">
                  <img 
                    className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                    alt="A close-up photograph of a futuristic high-tech server room with glowing green and blue LED lights against a dark, metallic background. The focus is sharp on intricate circuitry and glowing optical fibers, creating a mood of absolute security and technical mastery. The lighting is low-key with intense highlights, emphasizing a clean, sophisticated digital landscape." 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeg169THBM69vkXf_xWOltZrhnPFXN4Sp59Hi6XlNHZhRLGYj0KmU2LxMqtFnE9Bu6A6QN-QSjWQk_AJ6ukNwoG48PW1csQELB2ADipMVtOgC9qFZ-OfjCiIbf-ZomSYLhEaqxxSzfKO6WCP1uoh6pF1H0DLFqtxNV9dX5UghWZOUgs2wIwlOn6ne0lk1H-Adj1M-ycZCtJklpq-1QhA0ManXYaQJK6D_QGidublm3eQCIQByPTKdCRGu6Rrde7KA0TQrFgAfn_A"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA / Pricing Section */}
        <section ref={pricingRef} className="py-24 px-margin-page text-center bg-[#0A0B0D] border-t border-outline-variant/10">
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-[56px] text-on-surface mb-md tracking-tight font-bold">Ready to illuminate your data?</h2>
            <p className="text-on-surface-variant text-body-lg mb-xl">Join 500+ enterprises using Luminary for secure internal intelligence.</p>
            <button 
              onClick={handleGetStarted}
              className="px-xl py-md bg-primary-container text-on-primary-container font-bold rounded-lg hover:brightness-110 transition-all active:scale-95 text-body-lg shadow-[0_0_60px_rgba(250,189,0,0.2)] cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/10 w-full py-xl relative z-10">
        <div className="max-w-7xl mx-auto px-margin-page flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex flex-col items-center md:items-start gap-xs">
            <div className="text-headline-sm text-primary-container font-bold tracking-tight flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
              Luminary
            </div>
            <div className="text-on-surface-variant text-body-md">© 2026 Luminary Intelligence. All rights reserved.</div>
          </div>
          <div className="flex gap-lg">
            <a href="https://clerk.com" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary-container transition-colors text-body-md font-medium">Privacy</a>
            <a href="https://clerk.com" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary-container transition-colors text-body-md font-medium">Terms</a>
            <a href="https://fastapi.tiangolo.com" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary-container transition-colors text-body-md font-medium">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
