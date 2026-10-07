import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import { useSettingsStore } from './store/useSettingsStore';

export default function App() {
  const { theme, toggleTheme } = useSettingsStore();

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
    window.location.hash = '#editor';
    setCurrentView('editor');
  };

  const backToLanding = () => {
    window.location.hash = '#';
    setCurrentView('landing');
  };

  if (currentView === 'editor') {
    return <Layout onBackToLanding={backToLanding} />;
  }

  return <LandingPage onLaunchApp={launchEditor} />;
}

