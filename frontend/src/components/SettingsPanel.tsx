import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

export default function SettingsPanel() {
  const { user } = useUser();

  // Local state for profile details (falls back to Stitch default if not logged in)
  const [profileName, setProfileName] = useState('Adrian Voss');
  const [profileEmail, setProfileEmail] = useState('adrian.voss@quantum-labs.io');
  const [timezone] = useState('UTC -08:00 (Pacific Time)');
  const [language] = useState('English (United States)');
  
  // Settings values persisted in local state/localStorage
  const [autoVectorize, setAutoVectorize] = useState(() => {
    return localStorage.getItem('setting_auto_vectorize') !== 'false';
  });
  const [contextMemory, setContextMemory] = useState(() => {
    return localStorage.getItem('setting_context_memory') === 'true';
  });
  const [retentionDays, setRetentionDays] = useState(() => {
    return localStorage.getItem('setting_retention_days') || '30 Days';
  });

  // Modal display states
  const [activeModal, setActiveModal] = useState<'profile' | 'password' | 'tfa' | 'delete' | null>(null);
  
  // Form input states
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempTfaCode, setTempTfaCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Sync profile details with Clerk user if logged in
  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || user.firstName || 'Adrian Voss');
      setProfileEmail(user.emailAddresses[0]?.emailAddress || 'adrian.voss@quantum-labs.io');
    }
  }, [user]);

  const handleToggleAutoVectorize = () => {
    const newVal = !autoVectorize;
    setAutoVectorize(newVal);
    localStorage.setItem('setting_auto_vectorize', String(newVal));
    showToast(`Auto-Vectorization turned ${newVal ? 'ON' : 'OFF'}`);
  };

  const handleToggleContextMemory = () => {
    const newVal = !contextMemory;
    setContextMemory(newVal);
    localStorage.setItem('setting_context_memory', String(newVal));
    showToast(`Contextual Memory turned ${newVal ? 'ON' : 'OFF'}`);
  };

  const handleRetentionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setRetentionDays(val);
    localStorage.setItem('setting_retention_days', val);
    showToast(`Retention set to ${val}`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = (type: 'profile' | 'password' | 'tfa' | 'delete') => {
    if (type === 'profile') {
      setTempName(profileName);
      setTempEmail(profileEmail);
    } else {
      setTempPassword('');
      setTempTfaCode('');
    }
    setActiveModal(type);
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileName(tempName);
    setProfileEmail(tempEmail);
    setActiveModal(null);
    showToast('Profile details updated successfully');
  };

  const handleSecurityAction = (action: string) => {
    setActiveModal(null);
    showToast(`${action} activated successfully (Simulated)`);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-xl bg-[#121315]">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-surface-container-high border-primary-fixed-dim/30 text-on-surface shadow-2xl animate-fade-in">
          <span className="material-symbols-outlined text-primary-fixed-dim">verified</span>
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="max-w-5xl mx-auto flex flex-col gap-lg relative">
        {/* Ambient Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[400px] h-[400px] rounded-full bg-primary-container/3 blur-[100px]"></div>
          <div className="absolute bottom-[20%] -right-[15%] w-[500px] h-[500px] rounded-full bg-primary-fixed-dim/2 blur-[120px]"></div>
        </div>

        {/* Page Header */}
        <header className="flex flex-col gap-xs border-b border-outline-variant/10 pb-lg relative z-10">
          <h2 className="text-display-lg font-bold text-primary tracking-tight">Account Settings</h2>
          <p className="text-body-lg text-on-surface-variant">Manage your luminary profile, subscription, and data preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg relative z-10">
          {/* Main Controls Section */}
          <section className="lg:col-span-2 space-y-lg">
            {/* Account Details Card */}
            <div className="glass-panel rounded-xl p-lg flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <h3 className="text-headline-sm font-semibold text-on-surface">Account Details</h3>
                <button 
                  onClick={() => openModal('profile')}
                  className="text-primary-container hover:underline font-semibold text-label-caps cursor-pointer"
                >
                  EDIT PROFILE
                </button>
              </div>
              <div className="flex items-center gap-md py-sm">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-primary/20 bg-surface-container-highest flex items-center justify-center text-display-lg font-bold text-primary-fixed-dim">
                    {profileName[0]?.toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-primary-container rounded-full p-1 border-2 border-surface">
                    <span className="material-symbols-outlined text-[16px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-headline-md font-bold text-on-surface">{profileName}</span>
                  <span className="text-body-md text-on-surface-variant">{profileEmail}</span>
                  <div className="flex gap-xs mt-xs">
                    <span className="bg-surface-variant px-xs py-1 rounded text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border border-outline-variant/30">Admin</span>
                    <span className="bg-primary-container/10 px-xs py-1 rounded text-[10px] font-bold text-primary-container uppercase tracking-widest border border-primary-container/20">Enterprise</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md pt-sm border-t border-outline-variant/10">
                <div>
                  <label className="text-label-caps text-on-surface-variant block mb-base font-semibold">Timezone</label>
                  <span className="text-body-md text-on-surface">{timezone}</span>
                </div>
                <div>
                  <label className="text-label-caps text-on-surface-variant block mb-base font-semibold">Language</label>
                  <span className="text-body-md text-on-surface">{language}</span>
                </div>
              </div>
            </div>

            {/* Intelligence Settings Card */}
            <div className="glass-panel rounded-xl p-lg flex flex-col gap-md">
              <h3 className="text-headline-sm font-semibold text-on-surface">Intelligence Settings</h3>
              <div className="space-y-sm">
                {/* Auto-Vectorization Toggle */}
                <div className="flex items-center justify-between py-xs">
                  <div>
                    <p className="font-bold text-on-surface text-body-md">Auto-Vectorization</p>
                    <p className="text-label-caps text-on-surface-variant">Automatically index new documents for RAG</p>
                  </div>
                  <button 
                    onClick={handleToggleAutoVectorize}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-250 flex items-center ${autoVectorize ? 'bg-primary-container' : 'bg-surface-container-highest border border-outline-variant/20'}`}
                  >
                    <div className={`w-3 h-3 rounded-full transition-all duration-250 absolute ${autoVectorize ? 'right-1 bg-on-primary-container' : 'left-1 bg-on-surface-variant'}`} />
                  </button>
                </div>

                {/* Contextual Memory Toggle */}
                <div className="flex items-center justify-between py-xs border-t border-outline-variant/10 pt-sm">
                  <div>
                    <p className="font-bold text-on-surface text-body-md">Contextual Memory</p>
                    <p className="text-label-caps text-on-surface-variant">Maintain chat history context across sessions</p>
                  </div>
                  <button 
                    onClick={handleToggleContextMemory}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-250 flex items-center ${contextMemory ? 'bg-primary-container' : 'bg-surface-container-highest border border-outline-variant/20'}`}
                  >
                    <div className={`w-3 h-3 rounded-full transition-all duration-250 absolute ${contextMemory ? 'right-1 bg-on-primary-container' : 'left-1 bg-on-surface-variant'}`} />
                  </button>
                </div>

                {/* Data Retention Select */}
                <div className="flex items-center justify-between py-xs border-t border-outline-variant/10 pt-sm">
                  <div>
                    <p className="font-bold text-on-surface text-body-md">Data Retention</p>
                    <p className="text-label-caps text-on-surface-variant">Store analysis logs for a custom duration</p>
                  </div>
                  <select 
                    value={retentionDays}
                    onChange={handleRetentionChange}
                    className="bg-surface-container-high border-none text-body-md rounded-lg text-on-surface px-sm py-xs focus:ring-1 focus:ring-primary-fixed-dim cursor-pointer outline-none"
                  >
                    <option value="30 Days">30 Days</option>
                    <option value="90 Days">90 Days</option>
                    <option value="Infinite">Infinite</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="glass-panel rounded-xl p-lg flex flex-col gap-md">
              <h3 className="text-headline-sm font-semibold text-on-surface">Privacy & Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                <button 
                  onClick={() => openModal('password')}
                  className="flex items-center justify-between p-sm bg-surface-container-low border border-outline-variant/20 rounded-lg hover:bg-surface-container transition-colors group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary-container">lock</span>
                    <span className="font-bold text-on-surface text-body-md">Change Password</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
                <button 
                  onClick={() => openModal('tfa')}
                  className="flex items-center justify-between p-sm bg-surface-container-low border border-outline-variant/20 rounded-lg hover:bg-surface-container transition-colors group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary-container">shield</span>
                    <span className="font-bold text-on-surface text-body-md">Two-Factor Auth</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
              </div>
            </div>
          </section>

          {/* Right Sidebar Details */}
          <aside className="space-y-lg">
            {/* Subscription Card */}
            <div className="bg-primary-container/5 border border-primary-container/20 rounded-xl p-lg flex flex-col gap-md relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl"></div>
              <h3 className="text-headline-sm font-bold text-primary-container">Enterprise Plan</h3>
              <div className="flex items-baseline gap-xs">
                <span className="text-display-lg font-bold text-on-surface">$499</span>
                <span className="text-body-md text-on-surface-variant">/ month</span>
              </div>
              <p className="text-label-caps text-on-surface-variant font-semibold uppercase">Next billing date: Jan 12, 2027</p>
              <div className="space-y-xs mt-sm text-body-md">
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Unlimited Documents</span>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Priority GPU Processing</span>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Advanced API Access</span>
                </div>
              </div>
              <button 
                onClick={() => showToast('Subscription portal loading... (Simulated)')}
                className="w-full bg-primary-container text-on-primary-container py-sm rounded-lg font-bold mt-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Manage Subscription
              </button>
            </div>

            {/* Resource Usage Card */}
            <div className="glass-panel rounded-xl p-lg flex flex-col gap-md">
              <h3 className="text-headline-sm font-semibold text-on-surface">Resource Usage</h3>
              <div className="space-y-md">
                <div>
                  <div className="flex justify-between text-label-caps text-on-surface-variant mb-xs font-semibold">
                    <span>Storage Used</span>
                    <span>4.2 GB / 50 GB</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: '8.4%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-label-caps text-on-surface-variant mb-xs font-semibold">
                    <span>AI Tokens (Current Month)</span>
                    <span>1.2M / 10M</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Accent Card */}
            <div className="relative h-48 rounded-xl overflow-hidden group cursor-pointer" onClick={() => showToast('Redirecting to insights blog...')}>
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt="A futuristic digital network visualization with golden nodes connected by thin white lines over a deep black background. The image has a heavy glassmorphism feel, with soft glows and a premium technical aesthetic. It represents the Luminary intelligence network and high-speed data processing capabilities." 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKf2o3HYhaGeGWBOTKPaQnnLPlHmz-amTE7s6DQt3CaGykJECfRA-iA7AQum5jgxi6yNpaCmsFVufn6TYGpGV0WdNtXYVxqK0tIb47_haQRncPRyMA6SVHugCeWEHgpy_3e0mygYzaW1Lqa0uN7yQEClLgvVa9Nc5cZn-yhfS6RimXAKbc2XhzwB4zZWrEP3U5XrxRTMvAtXVedYiT_UWUFPWqDko063xJdsSPWyfyDE3i1RUJWKDuVNEMqFI3IV-owerPKpLeeQ"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-80"></div>
              <div className="absolute bottom-sm left-sm right-sm text-left">
                <p className="text-label-caps font-semibold text-primary mb-xs uppercase tracking-wider">LUMINARY INSIGHTS</p>
                <p className="text-body-md font-bold text-on-surface leading-tight">Explore the latest enterprise RAG strategies.</p>
              </div>
            </div>
          </aside>
        </div>

        {/* Danger Zone */}
        <footer className="mt-xl pt-lg border-t border-error-container/40 flex flex-col gap-md">
          <h3 className="text-headline-sm font-semibold text-error">Danger Zone</h3>
          <div className="glass-panel border-error-container/20 rounded-xl p-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
            <div>
              <p className="font-bold text-on-surface text-body-md">Delete Account</p>
              <p className="text-label-caps text-on-surface-variant">Permanently remove all your documents, history, and analytical data.</p>
            </div>
            <button 
              onClick={() => openModal('delete')}
              className="px-lg py-xs border border-error text-error font-bold rounded hover:bg-error-container/20 transition-colors cursor-pointer"
            >
              Delete Profile
            </button>
          </div>
        </footer>
      </div>

      {/* Modals Layer */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel border border-outline-variant/30 rounded-xl p-lg max-w-md w-full flex flex-col gap-md shadow-2xl relative">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {activeModal === 'profile' && (
              <form onSubmit={saveProfile} className="flex flex-col gap-md">
                <h3 className="text-headline-sm font-bold text-primary">Edit Account Details</h3>
                <div className="flex flex-col gap-xs text-left">
                  <label className="text-label-caps text-on-surface-variant font-semibold">Display Name</label>
                  <input 
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    required
                    className="w-full bg-[#1b1c1e] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface outline-none focus:border-primary-container"
                  />
                </div>
                <div className="flex flex-col gap-xs text-left">
                  <label className="text-label-caps text-on-surface-variant font-semibold">Email Address</label>
                  <input 
                    type="email" 
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    required
                    className="w-full bg-[#1b1c1e] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface outline-none focus:border-primary-container"
                  />
                </div>
                <div className="flex justify-end gap-sm mt-sm">
                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-md py-xs rounded bg-surface-container-high text-on-surface hover:bg-surface-variant/40 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-md py-xs rounded bg-primary-container text-on-primary-container font-bold hover:brightness-110 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'password' && (
              <div className="flex flex-col gap-md">
                <h3 className="text-headline-sm font-bold text-primary">Change Password</h3>
                <p className="text-body-md text-on-surface-variant">Enter a new secure password for your account.</p>
                <div className="flex flex-col gap-xs text-left">
                  <label className="text-label-caps text-on-surface-variant font-semibold">New Password</label>
                  <input 
                    type="password" 
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#1b1c1e] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface outline-none focus:border-primary-container"
                  />
                </div>
                <div className="flex justify-end gap-sm mt-sm">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="px-md py-xs rounded bg-surface-container-high text-on-surface hover:bg-surface-variant/40 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleSecurityAction('Password change')}
                    className="px-md py-xs rounded bg-primary-container text-on-primary-container font-bold hover:brightness-110 cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'tfa' && (
              <div className="flex flex-col gap-md">
                <h3 className="text-headline-sm font-bold text-primary">Two-Factor Authentication</h3>
                <p className="text-body-md text-on-surface-variant">Scan the barcode using your authenticator app and enter the verification code.</p>
                <div className="flex justify-center py-sm">
                  <div className="w-32 h-32 bg-white p-2 rounded flex items-center justify-center">
                    {/* Simulated QR code graphic */}
                    <div className="w-full h-full bg-[#121315] rounded flex items-center justify-center text-[10px] text-primary-fixed-dim">
                      [QR CODE]
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-xs text-left">
                  <label className="text-label-caps text-on-surface-variant font-semibold">Verification Code</label>
                  <input 
                    type="text" 
                    value={tempTfaCode}
                    onChange={(e) => setTempTfaCode(e.target.value)}
                    placeholder="000 000"
                    maxLength={6}
                    required
                    className="w-full bg-[#1b1c1e] border border-outline-variant/30 rounded-lg py-sm px-md text-body-md text-on-surface text-center tracking-widest outline-none focus:border-primary-container"
                  />
                </div>
                <div className="flex justify-end gap-sm mt-sm">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="px-md py-xs rounded bg-surface-container-high text-on-surface hover:bg-surface-variant/40 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleSecurityAction('Two-Factor authentication')}
                    className="px-md py-xs rounded bg-primary-container text-on-primary-container font-bold hover:brightness-110 cursor-pointer"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'delete' && (
              <div className="flex flex-col gap-md text-left">
                <h3 className="text-headline-sm font-bold text-error">Permanently Delete Account?</h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  This action is <strong className="text-on-surface">irreversible</strong>. All your documents, session message logs, and FAISS vectors will be immediately erased.
                </p>
                <div className="flex justify-end gap-sm mt-sm">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="px-md py-xs rounded bg-surface-container-high text-on-surface hover:bg-surface-variant/40 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleSecurityAction('Account deletion request')}
                    className="px-md py-xs rounded bg-error text-white font-bold hover:brightness-110 cursor-pointer"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
