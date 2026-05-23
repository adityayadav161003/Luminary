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
        <div className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto h-16">
          <div className="text-lg font-bold text-primary-container tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
            Luminary
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollTo(solutionsRef)} 
              className="text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium cursor-pointer"
            >
              Solutions
            </button>
            <button 
              onClick={() => scrollTo(securityRef)} 
              className="text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium cursor-pointer"
            >
              Security
            </button>
            <button 
              onClick={() => scrollTo(pricingRef)} 
              className="text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium cursor-pointer"
            >
              Pricing
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGetStarted}
              className="text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={handleGetStarted}
              className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all active:scale-95 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="mesh-gradient min-h-screen pt-16 flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-24 px-6 md:px-12">
          {/* Background Atmospheric Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary-container/5 blur-[120px]"></div>
            <div className="absolute bottom-[10%] -left-[5%] w-[400px] h-[400px] rounded-full bg-primary-fixed-dim/3 blur-[100px]"></div>
          </div>

          <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-outline-variant/30 bg-surface-container-low mb-6">
              <span className="material-symbols-outlined text-primary-container text-[14px]">bolt</span>
              <span className="text-xs uppercase tracking-wider font-semibold text-primary-container">Now in Private Beta</span>
            </div>
            <h1 className="text-4xl md:text-[72px] md:leading-[1.1] text-on-surface mb-6 tracking-tight max-w-4xl font-bold">
              Chat with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-fixed-dim">your knowledge.</span>
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mb-8">
              Secure, private document analysis powered by advanced RAG pipelines. We process your data in memory—never saving a single byte to our servers.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-3.5 bg-primary-container text-on-primary-container font-bold rounded-lg hover:brightness-110 transition-all active:scale-95 text-base md:text-lg shadow-[0_0_40px_rgba(250,189,0,0.15)] cursor-pointer"
              >
                Get Started Free
              </button>
              <button 
                onClick={() => scrollTo(solutionsRef)}
                className="w-full sm:w-auto px-8 py-3.5 border border-outline text-on-surface font-semibold rounded-lg hover:bg-surface-variant/20 transition-all text-base md:text-lg cursor-pointer"
              >
                Explore Features
              </button>
            </div>

            {/* Abstract UI Preview */}
            <div className="mt-24 w-full max-w-5xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-container/20 to-transparent blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative backdrop-blur-xl bg-surface-container/60 border border-outline-variant/30 rounded-xl overflow-hidden shadow-2xl">
                <div className="h-10 bg-surface-container border-b border-outline-variant/20 flex items-center px-4 gap-2">
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
        <section ref={solutionsRef} className="py-24 px-6 md:px-12 bg-[#0A0B0D] border-t border-outline-variant/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-4">
              <div className="max-w-xl">
                <h2 className="text-xs uppercase tracking-wider font-bold text-primary-container mb-3 tracking-widest">Architecture</h2>
                <h3 className="text-[40px] leading-tight text-on-surface font-bold">The Intelligence Workspace.</h3>
              </div>
              <p className="text-on-surface-variant max-w-md text-sm md:text-base leading-relaxed">
                Luminary transforms static documents into a dynamic conversation partner using our proprietary context injection engine.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Card 1 */}
              <div className="bento-reveal md:col-span-2 p-8 bg-surface-container rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col justify-between group min-h-[320px]">
                <div>
                  <span className="material-symbols-outlined text-primary-container text-[32px] mb-6" style={{ fontVariationSettings: "'FILL' 0" }}>upload_file</span>
                  <h4 className="text-lg md:text-xl text-on-surface font-bold mb-3">Instant Indexing</h4>
                  <p className="text-on-surface-variant max-w-sm text-sm">Drag and drop your PDFs, Markdown, or JSON. Our pipeline parses and vectorizes data in milliseconds.</p>
                </div>
                <div className="mt-6 flex gap-2">
                  <div className="h-1 w-12 bg-primary rounded-full"></div>
                  <div className="h-1 w-6 bg-outline-variant rounded-full"></div>
                  <div className="h-1 w-6 bg-outline-variant rounded-full"></div>
                </div>
              </div>
              {/* Bento Card 2 */}
              <div className="bento-reveal p-8 bg-surface-container rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col justify-center items-center text-center group">
                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:scale-125 transition-transform"></div>
                  <span className="material-symbols-outlined text-primary-container text-[48px] relative z-10" style={{ fontVariationSettings: "'FILL' 0" }}>psychology</span>
                </div>
                <h4 className="text-lg md:text-xl text-on-surface font-bold mb-3">Neural Retrieval</h4>
                <p className="text-on-surface-variant text-sm">Advanced semantic search ensures only relevant context reaches the LLM.</p>
              </div>
              {/* Bento Card 3 */}
              <div className="bento-reveal p-8 bg-surface-container rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col group justify-between min-h-[240px]">
                <div>
                  <span className="material-symbols-outlined text-primary-container text-[32px] mb-6" style={{ fontVariationSettings: "'FILL' 0" }}>encrypted</span>
                  <h4 className="text-lg md:text-xl text-on-surface font-bold mb-3">No Persistence</h4>
                  <p className="text-on-surface-variant text-sm">Your files are shredded and wiped from memory the moment your session ends.</p>
                </div>
              </div>
              {/* Bento Card 4 */}
              <div className="bento-reveal md:col-span-2 p-8 bg-surface-container rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col md:flex-row items-center gap-12 group overflow-hidden">
                <div className="flex-grow">
                  <h4 className="text-lg md:text-xl text-on-surface font-bold mb-3">Context-Aware Chat</h4>
                  <p className="text-on-surface-variant text-sm">Ask complex questions about cross-document relationships and get cited, factual answers based only on your data.</p>
                </div>
                <div className="flex-1 w-full bg-[#0d0e10] p-4 rounded-lg border border-outline-variant/20 font-mono text-[13px] text-on-surface-variant">
                  <div className="flex items-center gap-2 mb-2 text-primary/70">
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
        <section ref={securityRef} className="py-24 px-6 md:px-12 bg-[#0A0B0D] border-t border-outline-variant/10">
          <div className="max-w-7xl mx-auto backdrop-blur-xl bg-surface-container/60 p-8 md:p-24 rounded-3xl border border-outline-variant/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-container/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-xs uppercase tracking-wider font-bold text-primary-container mb-3 tracking-widest">Security Standards</h2>
                <h3 className="text-[48px] leading-tight text-on-surface font-bold mb-6">Privacy is not a feature, <br />it's our foundation.</h3>
                <p className="text-on-surface-variant text-base md:text-lg mb-8 max-w-lg">
                  We use zero-trust architecture and client-side encryption for all document processing. Luminary never trains on your data, and we never store your uploads.
                </p>
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 0" }}>verified_user</span>
                    <div>
                      <h5 className="font-bold text-on-surface text-base md:text-lg">SOC2 Type II Compliant</h5>
                      <p className="text-on-surface-variant text-sm">Enterprise-grade security infrastructure for sensitive data.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 0" }}>lock_reset</span>
                    <div>
                      <h5 className="font-bold text-on-surface text-base md:text-lg">AES-256 Encryption</h5>
                      <p className="text-on-surface-variant text-sm">Data is encrypted at rest and in transit with the highest standards.</p>
                    </div>
                  </div>
                </div>
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
        <section ref={pricingRef} className="py-24 px-6 md:px-12 text-center bg-[#0A0B0D] border-t border-outline-variant/10">
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-[56px] text-on-surface mb-6 tracking-tight font-bold">Ready to illuminate your data?</h2>
            <p className="text-on-surface-variant text-base md:text-lg mb-8">Join 500+ enterprises using Luminary for secure internal intelligence.</p>
            <button 
              onClick={handleGetStarted}
              className="px-8 py-3.5 bg-primary-container text-on-primary-container font-bold rounded-lg hover:brightness-110 transition-all active:scale-95 text-base md:text-lg shadow-[0_0_60px_rgba(250,189,0,0.2)] cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/10 w-full py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-lg text-primary-container font-bold tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
              Luminary
            </div>
            <div className="text-on-surface-variant text-sm">© 2026 Luminary Intelligence. All rights reserved.</div>
          </div>
          <div className="flex gap-8">
            <a href="https://clerk.com" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary-container transition-colors text-sm font-medium">Privacy</a>
            <a href="https://clerk.com" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary-container transition-colors text-sm font-medium">Terms</a>
            <a href="https://fastapi.tiangolo.com" target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary-container transition-colors text-sm font-medium">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
