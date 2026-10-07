import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ClerkProvider,
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
  UserButton as ClerkUserButton,
  useUser as useClerkUser,
  useClerk
} from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useSettingsStore } from '../store/useSettingsStore';

const AuthContext = createContext({
  isLoaded: false,
  hasClerkKey: false,
  clerkKey: '',
  isSignedIn: false,
  user: null,
  openSignIn: () => {},
  openSignUp: () => {},
});

export const useAuthStatus = () => useContext(AuthContext);

// Wrapper that has access to Clerk's internal hooks
function ClerkAuthBridge({ children, clerkKey }) {
  const { isLoaded, isSignedIn, user } = useClerkUser();
  const clerk = useClerk();

  const handleOpenSignIn = (opts) => {
    if (clerk && clerk.openSignIn) {
      clerk.openSignIn(opts || {});
    }
  };

  const handleOpenSignUp = (opts) => {
    if (clerk && clerk.openSignUp) {
      clerk.openSignUp(opts || {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        hasClerkKey: true,
        clerkKey,
        isSignedIn: !!isSignedIn,
        user: user || null,
        openSignIn: handleOpenSignIn,
        openSignUp: handleOpenSignUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default function ClerkAuthProvider({ children }) {
  const { theme } = useSettingsStore();
  const [clerkKey, setClerkKey] = useState(
    () => import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch Clerk configuration from backend server on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchBackendConfig() {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.clerkPublishableKey) {
            setClerkKey(data.clerkPublishableKey);
          }
        }
      } catch (err) {
        console.warn('Backend /api/config unavailable:', err.message);
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    fetchBackendConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  if (clerkKey && clerkKey.startsWith('pk_')) {
    return (
      <ClerkProvider
        publishableKey={clerkKey}
        afterSignOutUrl="/"
        appearance={{
          baseTheme: theme === 'dark' ? dark : undefined,
          variables: {
            colorPrimary: '#8b5cf6',
            colorBackground: theme === 'dark' ? '#0f0f1c' : '#ffffff',
            colorText: theme === 'dark' ? '#f8fafc' : '#0f172a',
          },
        }}
      >
        <ClerkAuthBridge clerkKey={clerkKey}>
          {children}
        </ClerkAuthBridge>
      </ClerkProvider>
    );
  }

  // Fallback when Clerk key is not yet configured
  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        hasClerkKey: false,
        clerkKey: '',
        isSignedIn: false,
        user: null,
        openSignIn: () => {},
        openSignUp: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Unified Auth Controls for Navbar & Modals
export function AuthNavControls() {
  const { hasClerkKey } = useAuthStatus();

  if (hasClerkKey) {
    return (
      <div className="flex items-center gap-2">
        <ClerkSignedOut>
          <ClerkSignInButton mode="modal">
            <button className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer shadow-sm">
              Sign In
            </button>
          </ClerkSignInButton>
          <ClerkSignUpButton mode="modal">
            <button className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 transition-all cursor-pointer">
              Sign Up
            </button>
          </ClerkSignUpButton>
        </ClerkSignedOut>
        <ClerkSignedIn>
          <div className="flex items-center gap-2.5 pl-1">
            <ClerkUserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8 rounded-xl border border-purple-500/40 shadow-sm',
                },
              }}
            />
          </div>
        </ClerkSignedIn>
      </div>
    );
  }

  // When backend does not have Clerk key set yet, render clean buttons
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => console.info('Clerk backend key not configured yet in .env')}
        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer shadow-sm"
      >
        Sign In
      </button>
      <button
        onClick={() => console.info('Clerk backend key not configured yet in .env')}
        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
      >
        Sign Up
      </button>
    </div>
  );
}

// Protected Auth Gate component when user is not signed in
export function ProtectedAuthGate({ onBackToLanding }) {
  const { openSignIn, openSignUp } = useAuthStatus();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0b0b14] text-slate-100 p-6 relative overflow-hidden">
      {/* Background Aurora */}
      <div className="fixed inset-0 pointer-events-none bg-radial-aurora z-0 opacity-80" />
      <div className="fixed inset-0 pointer-events-none bg-grid-pattern z-0 opacity-40" />

      <div className="relative z-10 w-full max-w-md glass-card-glow rounded-3xl p-8 sm:p-10 border border-purple-500/30 text-center shadow-2xl">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-600/30">
          <span className="text-3xl">🔒</span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          Login Required
        </h2>

        <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
          Please sign in or create a free account to access the PromptToCode AI Studio and workspace.
        </p>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => openSignIn()}
            className="glow-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Sign In with Clerk
          </button>

          <button
            onClick={() => openSignUp()}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 transition-all cursor-pointer"
          >
            Create Free Account
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={onBackToLanding}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors cursor-pointer"
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}
