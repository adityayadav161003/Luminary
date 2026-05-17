/**
 * Luminary App — Routing with Clerk auth.
 * / → Landing (public, works without Clerk key)
 * /app → Workspace (protected by Clerk)
 * /sign-in, /sign-up → Clerk auth components
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing'));

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

function Loader() {
  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-surface)]">
      <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ClerkMissing() {
  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-surface)]">
      <div className="text-center px-8 animate-fade-in">
        <p className="text-[var(--color-danger)] text-sm font-semibold mb-2">Clerk key missing</p>
        <p className="text-[var(--color-ink-muted)] text-xs max-w-sm">
          Set VITE_CLERK_PUBLISHABLE_KEY in your .env file. Get it from{' '}
          <a href="https://dashboard.clerk.com" className="text-[var(--color-accent)] underline" target="_blank" rel="noreferrer">Clerk Dashboard</a>.
        </p>
      </div>
    </div>
  );
}

/** Lazy-loaded Clerk wrapper — only imported when Clerk key is available */
const ClerkRoutes = lazy(async () => {
  const { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn } = await import('@clerk/clerk-react');
  const { dark } = await import('@clerk/themes');
  const Workspace = (await import('./pages/Workspace')).default;

  function AuthPage({ children }: { children: React.ReactNode }) {
    return <div className="h-screen flex items-center justify-center bg-[var(--color-surface)]">{children}</div>;
  }

  function ProtectedRoute({ children }: { children: React.ReactNode }) {
    return <><SignedIn>{children}</SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>;
  }

  function Inner() {
    return (
      <ClerkProvider publishableKey={CLERK_KEY} appearance={{ baseTheme: dark }}>
        <Routes>
          <Route path="/app" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
          <Route path="/sign-in/*" element={<AuthPage><SignIn routing="path" path="/sign-in" /></AuthPage>} />
          <Route path="/sign-up/*" element={<AuthPage><SignUp routing="path" path="/sign-up" /></AuthPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ClerkProvider>
    );
  }

  return { default: Inner };
});

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          {CLERK_KEY ? (
            <Route path="/*" element={<Suspense fallback={<Loader />}><ClerkRoutes /></Suspense>} />
          ) : (
            <>
              <Route path="/app" element={<ClerkMissing />} />
              <Route path="/sign-in/*" element={<ClerkMissing />} />
              <Route path="/sign-up/*" element={<ClerkMissing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
