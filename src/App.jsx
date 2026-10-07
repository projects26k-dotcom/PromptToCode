import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import { useSettingsStore } from './store/useSettingsStore';
import { useAuthStatus, ProtectedAuthGate } from './components/ClerkAuthProvider';

export default function App() {
  const { theme } = useSettingsStore();
  const { hasClerkKey, isSignedIn, isLoaded, openSignIn } = useAuthStatus();

  // Sync theme with document root element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#editor' || hash === '#app') {
        return 'editor';
      }
    }
    return 'landing';
  });

  // Sync hash with browser history
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#editor' || hash === '#app') {
        setCurrentView('editor');
      } else if (hash === '#landing' || hash === '#home' || hash === '' || hash.startsWith('#features') || hash.startsWith('#how-it-works') || hash.startsWith('#demo') || hash.startsWith('#comparison') || hash.startsWith('#faq')) {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const launchEditor = () => {
    // If Clerk is configured and user is not logged in, prompt sign in
    if (hasClerkKey && isLoaded && !isSignedIn) {
      openSignIn();
      return;
    }
    window.location.hash = '#editor';
    setCurrentView('editor');
  };

  const backToLanding = () => {
    window.location.hash = '#';
    setCurrentView('landing');
  };

  if (currentView === 'editor') {
    // If Clerk is enabled and user is not signed in, gate access
    if (hasClerkKey && isLoaded && !isSignedIn) {
      return <ProtectedAuthGate onBackToLanding={backToLanding} />;
    }
    return <Layout onBackToLanding={backToLanding} />;
  }

  return <LandingPage onLaunchApp={launchEditor} />;
}


