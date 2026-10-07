import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  Eye,
  GitPullRequest,
  Wrench,
  History,
  GraduationCap,
  Download,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Cpu,
  Check,
  X as CloseIcon,
  Menu,
  Star,
  Play,
  RotateCcw,
  Copy,
  ExternalLink,
  Code2,
  Flame,
  ArrowUp,
  Sun,
  Moon
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

const HERO_CODE_SAMPLE = `import React, { useState } from 'react';

export default function CryptoTracker() {
  const [assets] = useState([
    { sym: 'BTC', name: 'Bitcoin', val: '$64,820', gain: '+5.2%' },
    { sym: 'ETH', name: 'Ethereum', val: '$3,510', gain: '+8.4%' },
    { sym: 'SOL', name: 'Solana', val: '$152', gain: '+12.1%' },
  ]);

  return (
    <div className="glass-card p-4 rounded-xl">
      <h3 className="text-sm font-bold text-white">Live Ticker</h3>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {assets.map(a => (
          <AssetCard key={a.sym} {...a} />
        ))}
      </div>
    </div>
  );
}`;

export default function LandingPage({ onLaunchApp }) {
  const { theme, toggleTheme } = useSettingsStore();

  // Navigation & Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Hero interactive code simulation state
  const heroPrompts = useMemo(() => [
    'Create a neon glassmorphic Crypto Dashboard with live price chart & portfolio stats',
    'Build an interactive Kanban board with drag-and-drop & tag filters',
    'Generate a modern AI Portfolio website with dark theme & project showcase'
  ], []);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedPrompt, setDisplayedPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [heroActiveTab, setHeroActiveTab] = useState('preview'); // 'preview' | 'code'

  // Live Demo Section Presets
  const demoPresets = useMemo(() => [
    {
      id: 'crypto',
      title: '💎 Crypto Dashboard',
      badge: 'DeFi & Charts',
      prompt: 'Build a sleek crypto portfolio tracker with real-time price tickers, glassmorphism cards, and buy/sell modal.',
      previewType: 'crypto',
      codeSnippet: `// CryptoDashboard.jsx\nexport default function CryptoDashboard() {\n  const [coins] = useState([\n    { name: "Bitcoin", sym: "BTC", price: "$64,280", change: "+4.2%", up: true },\n    { name: "Ethereum", sym: "ETH", price: "$3,490", change: "+6.8%", up: true },\n    { name: "Solana", sym: "SOL", price: "$148", change: "-1.2%", up: false },\n  ]);\n  return (\n    <div className="p-6 bg-slate-950 text-white rounded-2xl border border-purple-500/20">\n      <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Live Portfolio</h2>\n      <div className="grid grid-cols-3 gap-3 mt-4">\n        {coins.map(c => (\n          <div key={c.sym} className="p-3 rounded-xl bg-slate-900 border border-slate-800">\n            <div className="text-xs text-slate-400">{c.name}</div>\n            <div className="text-base font-bold mt-1">{c.price}</div>\n            <div className={"text-xs font-semibold " + (c.up ? "text-emerald-400" : "text-rose-400")}>{c.change}</div>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}`
    },
    {
      id: 'kanban',
      title: '📋 Kanban Task Board',
      badge: 'Productivity',
      prompt: 'Create a drag-and-drop Kanban task board with status columns (Todo, In Progress, Done) and priority tags.',
      previewType: 'kanban',
      codeSnippet: `// KanbanBoard.jsx\nexport default function KanbanBoard() {\n  const [tasks] = useState([\n    { id: 1, text: "Design Design System tokens", col: "progress", tag: "High" },\n    { id: 2, text: "Connect Gemini streaming API", col: "done", tag: "Core" },\n    { id: 3, text: "Export clean ZIP bundle", col: "todo", tag: "Feature" }\n  ]);\n  return (\n    <div className="p-5 bg-slate-950 rounded-2xl border border-indigo-500/20">\n      <div className="flex gap-4">\n        {["todo", "progress", "done"].map(col => (\n          <div key={col} className="flex-1 bg-slate-900/90 p-3 rounded-xl border border-slate-800">\n            <h4 className="text-xs uppercase font-semibold text-slate-400 mb-2">{col}</h4>\n            {tasks.filter(t => t.col === col).map(t => (\n              <div key={t.id} className="p-2.5 mb-2 bg-slate-800/80 rounded-lg text-xs font-medium border border-slate-700/50">\n                {t.text}\n              </div>\n            ))}\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}`
    },
    {
      id: 'weather',
      title: '🌦️ Dynamic Weather App',
      badge: 'API & Animations',
      prompt: 'Design a dynamic glassmorphic weather widget with 5-day forecast, air quality index, and animated weather icons.',
      previewType: 'weather',
      codeSnippet: `// WeatherWidget.jsx\nexport default function WeatherWidget() {\n  const [forecast] = useState([\n    { day: "Mon", temp: "72°", cond: "☀️ Sunny" },\n    { day: "Tue", temp: "68°", cond: "⛅ Partly Cloudy" },\n    { day: "Wed", temp: "65°", cond: "🌧️ Rain" },\n    { day: "Thu", temp: "70°", cond: "🌤️ Clear" }\n  ]);\n  return (\n    <div className="p-6 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 rounded-2xl border border-cyan-500/20 text-white">\n      <div className="flex justify-between items-center">\n        <div>\n          <h3 className="text-2xl font-bold">San Francisco</h3>\n          <p className="text-xs text-cyan-300">Air Quality: 28 • Excellent</p>\n        </div>\n        <div className="text-4xl font-extrabold">72°F</div>\n      </div>\n      <div className="grid grid-cols-4 gap-2 mt-6">\n        {forecast.map(f => (\n          <div key={f.day} className="text-center p-2 rounded-lg bg-slate-800/50">\n            <div className="text-xs text-slate-400">{f.day}</div>\n            <div className="text-lg my-1">{f.cond.split(' ')[0]}</div>\n            <div className="text-xs font-bold">{f.temp}</div>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}`
    },
    {
      id: 'portfolio',
      title: '🎨 AI Portfolio Site',
      badge: 'Creative & Bio',
      prompt: 'Generate an interactive developer portfolio with terminal hero, live project preview grid, and interactive contact form.',
      previewType: 'portfolio',
      codeSnippet: `// PortfolioHero.jsx\nexport default function PortfolioHero() {\n  return (\n    <div className="p-6 bg-slate-950 rounded-2xl border border-purple-500/20 text-white">\n      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 mb-3">\n        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />\n        Available for projects\n      </div>\n      <h1 className="text-2xl font-black tracking-tight">Alex Rivera</h1>\n      <p className="text-sm text-slate-400 mt-1">Full-Stack Creative Engineer • Building next-gen web apps with AI & React.</p>\n      <div className="flex gap-2 mt-4">\n        <button className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-xs font-semibold">View Projects</button>\n        <button className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-semibold">Get in Touch</button>\n      </div>\n    </div>\n  );\n}`
    }
  ], []);

  const [selectedDemo, setSelectedDemo] = useState(demoPresets[0]);
  const [customDemoPrompt, setCustomDemoPrompt] = useState('');
  const [isSimulatingDemo, setIsSimulatingDemo] = useState(false);
  const [demoActiveView, setDemoActiveView] = useState('app'); // 'app' | 'code'
  const [copiedCode, setCopiedCode] = useState(false);

  // Scroll listener for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hero prompt typewriter effect
  useEffect(() => {
    const targetText = heroPrompts[currentPromptIndex];
    let charIndex = 0;
    setDisplayedPrompt('');
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (charIndex <= targetText.length) {
        setDisplayedPrompt(targetText.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        const pauseTimeout = setTimeout(() => {
          setCurrentPromptIndex((prev) => (prev + 1) % heroPrompts.length);
        }, 4000);
        return () => clearTimeout(pauseTimeout);
      }
    }, 40);

    return () => clearInterval(typeInterval);
  }, [currentPromptIndex, heroPrompts]);

  const handleLaunch = () => {
    if (onLaunchApp) {
      onLaunchApp();
    } else {
      window.location.hash = '#editor';
    }
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyDemoCode = () => {
    navigator.clipboard.writeText(selectedDemo.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTriggerDemoGeneration = (preset) => {
    setIsSimulatingDemo(true);
    setSelectedDemo(preset);
    setTimeout(() => {
      setIsSimulatingDemo(false);
    }, 500);
  };

  const handleCustomPromptSubmit = (e) => {
    e.preventDefault();
    if (!customDemoPrompt.trim()) return;
    setIsSimulatingDemo(true);
    setTimeout(() => {
      setIsSimulatingDemo(false);
      setSelectedDemo({
        id: 'custom',
        title: '⚡ Custom Generation',
        badge: 'Custom Prompt',
        prompt: customDemoPrompt,
        previewType: 'crypto',
        codeSnippet: `// CustomApp.jsx\n// Generated by PromptToCode for: "${customDemoPrompt}"\nexport default function CustomApp() {\n  return (\n    <div className="p-6 bg-slate-950 rounded-2xl border border-purple-500/30 text-white">\n      <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">\n        Generated Component\n      </h2>\n      <p className="text-slate-300 text-sm mt-2 font-mono">\n        ${customDemoPrompt}\n      </p>\n    </div>\n  );\n}`
      });
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0b14] text-slate-100 font-sans relative overflow-x-hidden selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background Aurora Radial Gradients */}
      <div className="fixed inset-0 pointer-events-none bg-radial-aurora z-0 opacity-80" />
      <div className="fixed inset-0 pointer-events-none bg-grid-pattern z-0 opacity-40" />

      {/* ========================================================================= */}
      {/* 1. STICKY NAVBAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0b0b14]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all">
              <div className="h-full w-full bg-[#0b0b14] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Prompt<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">ToCode</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                v2.0 Free
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Live Demo</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </button>
            <button
              onClick={() => scrollToSection('comparison')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Why Us
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Action CTA & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            <button
              onClick={handleLaunch}
              className="glow-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Start Building Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>
            <button
              onClick={handleLaunch}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold"
            >
              Launch App
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-[#0b0b14]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 text-slate-300 hover:text-purple-400 font-medium text-sm"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-slate-300 hover:text-purple-400 font-medium text-sm"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="block w-full text-left py-2 text-slate-300 hover:text-purple-400 font-medium text-sm"
            >
              Live Demo Sandbox
            </button>
            <button
              onClick={() => scrollToSection('comparison')}
              className="block w-full text-left py-2 text-slate-300 hover:text-purple-400 font-medium text-sm"
            >
              Comparison
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left py-2 text-slate-300 hover:text-purple-400 font-medium text-sm"
            >
              FAQ
            </button>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Dark</span>
                  </>
                )}
              </button>
              <button
                onClick={handleLaunch}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-semibold text-center text-sm shadow-lg shadow-purple-600/30"
              >
                Start Building Free
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium mb-8 backdrop-blur-md animate-float-slow">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Free • Zero Setup • Powered by PromptToCode AI</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
          </div>

          {/* Big Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
            Describe It.{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Build It.
            </span>{' '}
            Ship It.
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            The free in-browser AI code studio that turns plain-English prompts and UI mockups into fully working Vanilla JS & React applications with real-time live preview.
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleLaunch}
              className="glow-btn w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-base shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Sparkles className="w-5 h-5 text-cyan-200 group-hover:rotate-12 transition-transform" />
              <span>Start Building Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => scrollToSection('demo')}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-base border border-slate-700/70 hover:border-purple-500/50 backdrop-blur-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 text-purple-400 fill-purple-400/20" />
              <span>Watch Interactive Demo</span>
            </button>
          </div>

          {/* Key Stat Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No Credit Card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Runs 100% in Browser
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400" /> Instant ZIP Export
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Self-Healing Auto-Fix
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO CODE EDITOR MOCKUP (Dynamic Typing Simulation) */}
        {/* ========================================================================= */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-purple-500/40 via-indigo-500/20 to-cyan-500/40 shadow-2xl shadow-purple-950/60">
            <div className="rounded-2xl bg-[#0e0e1a]/95 backdrop-blur-2xl border border-white/5 overflow-hidden">
              {/* Window Title Bar */}
              <div className="px-4 py-3 bg-[#0a0a12] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                    prompttocode ~ App.jsx
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setHeroActiveTab('preview')}
                    className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all cursor-pointer ${
                      heroActiveTab === 'preview'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Live Preview
                  </button>
                  <button
                    onClick={() => setHeroActiveTab('code')}
                    className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all cursor-pointer ${
                      heroActiveTab === 'code'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Source Code
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    <Sparkles className="w-3 h-3" />
                    PromptToCode AI Live
                  </span>
                </div>
              </div>

              {/* Prompt Input Header in Mockup */}
              <div className="p-4 bg-slate-950/60 border-b border-white/5 flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-slate-900/90 rounded-xl px-3.5 py-2 border border-slate-800 flex items-center gap-2 font-mono text-xs sm:text-sm text-slate-200 overflow-hidden">
                  <span className="text-purple-400 select-none">›</span>
                  <span className="truncate">{displayedPrompt}</span>
                  {isTyping && <span className="w-1.5 h-4 bg-cyan-400 animate-pulse shrink-0" />}
                </div>
                <button
                  onClick={() => {
                    setCurrentPromptIndex((prev) => (prev + 1) % heroPrompts.length);
                  }}
                  title="Next prompt demo"
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Mockup Body: Split View or Active Tab */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px]">
                {/* Left: Code Stream Mockup */}
                <div className={`lg:col-span-6 p-4 sm:p-5 font-mono text-xs bg-[#090910] border-r border-white/5 overflow-y-auto ${heroActiveTab === 'code' ? 'block' : 'hidden lg:block'}`}>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pb-3 mb-3 border-b border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-purple-400" />
                      src/components/CryptoTracker.jsx
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Syntax Validated
                    </span>
                  </div>
                  <pre className="text-slate-300 leading-relaxed overflow-x-auto">
                    <code>{HERO_CODE_SAMPLE}</code>
                  </pre>
                </div>

                {/* Right: Live UI Output Mockup */}
                <div className={`lg:col-span-6 p-4 sm:p-6 bg-gradient-to-br from-[#0e0e1e] to-[#121226] flex flex-col justify-between ${heroActiveTab === 'preview' ? 'block' : 'hidden lg:flex'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-semibold text-slate-300">Sandpack Live Preview</span>
                      </div>
                      <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                        Hot Reload: 12ms
                      </span>
                    </div>

                    {/* Rendered Live Component Simulator */}
                    <div className="glass-card-glow rounded-xl p-4 sm:p-5 border border-purple-500/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-slate-400">Total Portfolio Value</p>
                          <h4 className="text-2xl sm:text-3xl font-black text-white mt-1">
                            $48,290.40
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          +14.8% 24h
                        </span>
                      </div>

                      {/* Mini SVG Neon Chart */}
                      <div className="mt-4 h-16 w-full relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 300 60" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0,45 Q50,15 90,30 T180,10 T250,22 T300,5"
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="3"
                          />
                          <path
                            d="M0,45 Q50,15 90,30 T180,10 T250,22 T300,5 L300,60 L0,60 Z"
                            fill="url(#chartGrad)"
                          />
                        </svg>
                      </div>

                      {/* Asset Chips */}
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                          <div className="text-[10px] text-slate-400">BTC</div>
                          <div className="text-xs font-bold text-white">$64,820</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">+5.2%</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                          <div className="text-[10px] text-slate-400">ETH</div>
                          <div className="text-xs font-bold text-white">$3,510</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">+8.4%</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                          <div className="text-[10px] text-slate-400">SOL</div>
                          <div className="text-xs font-bold text-white">$152</div>
                          <div className="text-[10px] text-emerald-400 font-semibold">+12.1%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span>✨ Generated in 1.4s with PromptToCode AI</span>
                    <button
                      onClick={handleLaunch}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Open in IDE <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TRUST BAR */}
      {/* ========================================================================= */}
      <section className="relative z-10 border-y border-white/10 bg-slate-950/70 backdrop-blur-md py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-center md:text-left">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-wide">
                  Free • No Signup • Bring Your Own Gemini Key • Runs in Your Browser
                </p>
                <p className="text-xs text-slate-400">
                  Your code & API keys never touch our servers. Stored 100% locally in IndexedDB.
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap justify-center gap-4 text-xs font-medium text-slate-300">
              <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Client-Side Sandbox
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Zero Telemetry
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-purple-400" /> Production ZIP Ready
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURES GRID (6 CARDS WITH ICONS) */}
      {/* ========================================================================= */}
      <section id="features" className="relative z-10 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
            Engineered For Speed & Mastery
          </h2>
          <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Everything you need to prompt, iterate, and ship web apps.
          </p>
          <p className="mt-4 text-base text-slate-400">
            No mock setups or dumb copy-paste chat. PromptToCode is a complete full-stack web studio right inside your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Live Preview */}
          <div className="glass-card rounded-2xl p-7 transition-all hover:-translate-y-1.5 duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-5 group-hover:bg-purple-500/20 transition-colors">
              <Eye className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              Live Preview
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instant in-browser execution with real-time hot reloading. Test responsive layouts on desktop, tablet, and mobile with one click.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-purple-400">
              <span>Sandpack & iframe runtime</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Diff Review */}
          <div className="glass-card rounded-2xl p-7 transition-all hover:-translate-y-1.5 duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5 group-hover:bg-cyan-500/20 transition-colors">
              <GitPullRequest className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Diff Review & Staging
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Never wonder what the AI modified. Inspect side-by-side color-coded diff hunks, review line-by-line changes, and accept or reject with full control.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-cyan-400">
              <span>Granular hunk staging</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Auto-Fix */}
          <div className="glass-card rounded-2xl p-7 transition-all hover:-translate-y-1.5 duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 group-hover:bg-amber-500/20 transition-colors">
              <Wrench className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
              Self-Healing Auto-Fix
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Encountered a JavaScript runtime error or missing dependency? Our error listener catches stack traces and generates one-click self-healing patches.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-amber-400">
              <span>Automated error triage</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Version Timeline */}
          <div className="glass-card rounded-2xl p-7 transition-all hover:-translate-y-1.5 duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
              <History className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
              Version Timeline
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every prompt, code generation, and manual change creates an automatic immutable snapshot. Revert, branch, or restore past project states safely.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-indigo-400">
              <span>Time-travel snapshots</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Learn Mode */}
          <div className="glass-card rounded-2xl p-7 transition-all hover:-translate-y-1.5 duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:bg-emerald-500/20 transition-colors">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
              Interactive Learn Mode
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Don't just vibe code—learn the patterns. Activate Learn Mode to receive beginner-friendly explanations, key concepts, and live comprehension quizzes.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-emerald-400">
              <span>Code explanations & quizzes</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: One-Click ZIP Export */}
          <div className="glass-card rounded-2xl p-7 transition-all hover:-translate-y-1.5 duration-300 group">
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-5 group-hover:bg-rose-500/20 transition-colors">
              <Download className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rose-300 transition-colors">
              One-Click ZIP Export
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Zero platform lock-in. Download a clean, production-ready Vite + React repository with package.json and Tailwind config, ready to deploy to Vercel.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-rose-400">
              <span>Standard Vite project bundle</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HOW IT WORKS (3 STEPS WITH NUMBERED GLOWING CIRCLES) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="relative z-10 py-24 bg-[#0a0a14]/60 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">
              Frictionless Workflow
            </h2>
            <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              From prompt to production in 3 steps
            </p>
            <p className="mt-4 text-base text-slate-400">
              No npm installs, no complex terminal setups. Open the URL and start coding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="glass-card rounded-2xl p-8 relative flex flex-col items-start group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-purple-600/30 mb-6 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Describe
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Type what you want to build in plain English or attach screenshots and wireframes. Ask for features, custom styling, animations, or API mockups.
              </p>
              <div className="mt-auto w-full bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono text-purple-300">
                💬 "Build a Pomodoro timer with Spotify lofi sound effects"
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-card rounded-2xl p-8 relative flex flex-col items-start group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-600/30 mb-6 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Generate & Inspect
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Watch Gemini stream the multi-file architecture, review side-by-side diffs, and test live interactivity right in the Sandpack sandbox.
              </p>
              <div className="mt-auto w-full bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
                ⚡ Sandpack sandbox executes in &lt;500ms
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-card rounded-2xl p-8 relative flex flex-col items-start group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-cyan-600/30 mb-6 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Export & Ship
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Download a clean production ZIP bundle, copy component code, or deploy directly to Vercel and Netlify with standard Vite configurations.
              </p>
              <div className="mt-auto w-full bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300">
                📦 100% standard React + Vite + Tailwind
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. LIVE DEMO SECTION (Interactive Prompt Sandbox Simulator) */}
      {/* ========================================================================= */}
      <section id="demo" className="relative z-10 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            Interactive Playground
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Try a prompt before launching
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Click any example prompt below or enter your own idea to simulate how PromptToCode synthesizes components instantly.
          </p>
        </div>

        {/* Prompt Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto mb-8">
          {demoPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleTriggerDemoGeneration(preset)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                selectedDemo.id === preset.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40 scale-105'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-500/30'
              }`}
            >
              <span>{preset.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300">
                {preset.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Interactive Prompt Input Bar */}
        <form onSubmit={handleCustomPromptSubmit} className="max-w-3xl mx-auto mb-10">
          <div className="relative flex items-center">
            <input
              type="text"
              value={customDemoPrompt}
              onChange={(e) => setCustomDemoPrompt(e.target.value)}
              placeholder="e.g. Build an audio frequency visualizer with neon particle spectrum..."
              className="w-full px-5 py-4 pl-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-slate-500 text-sm outline-none shadow-xl transition-all"
            />
            <Sparkles className="w-5 h-5 text-purple-400 absolute left-4 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <span>Simulate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Live Simulator Preview Container */}
        <div className="max-w-4xl mx-auto glass-card-glow rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl">
          {/* Simulator Bar */}
          <div className="px-5 py-3.5 bg-slate-950/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">{selectedDemo.title}</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-purple-300 font-mono hidden sm:inline">
                {selectedDemo.badge}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center">
                <button
                  onClick={() => setDemoActiveView('app')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    demoActiveView === 'app'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Live App
                </button>
                <button
                  onClick={() => setDemoActiveView('code')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    demoActiveView === 'code'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  React Code
                </button>
              </div>

              {demoActiveView === 'code' && (
                <button
                  onClick={handleCopyDemoCode}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Simulator Content */}
          <div className="p-6 bg-[#0c0c18] min-h-[340px] flex items-center justify-center">
            {isSimulatingDemo ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="h-10 w-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                <p className="text-sm font-semibold text-purple-300">Synthesizing React component with PromptToCode AI...</p>
                <p className="text-xs text-slate-500">Injecting styles, state hooks & live hot reload</p>
              </div>
            ) : demoActiveView === 'app' ? (
              <div className="w-full max-w-xl mx-auto">
                {/* 1. Crypto Demo UI */}
                {selectedDemo.previewType === 'crypto' && (
                  <div className="p-5 bg-slate-900/90 rounded-2xl border border-purple-500/30 text-white shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">DeFi Live Hub</span>
                        <h4 className="text-xl font-black">Crypto Assets</h4>
                      </div>
                      <button
                        onClick={handleLaunch}
                        className="px-3 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        + Add Asset
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                            ₿
                          </div>
                          <div>
                            <div className="text-sm font-bold">Bitcoin</div>
                            <div className="text-[10px] text-slate-400">BTC • Vol: $28.4B</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black">$64,820.00</div>
                          <div className="text-xs font-semibold text-emerald-400">+5.42%</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                            Ξ
                          </div>
                          <div>
                            <div className="text-sm font-bold">Ethereum</div>
                            <div className="text-[10px] text-slate-400">ETH • Vol: $14.1B</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black">$3,510.80</div>
                          <div className="text-xs font-semibold text-emerald-400">+7.85%</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                            ◎
                          </div>
                          <div>
                            <div className="text-sm font-bold">Solana</div>
                            <div className="text-[10px] text-slate-400">SOL • Vol: $4.8B</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black">$152.40</div>
                          <div className="text-xs font-semibold text-rose-400">-1.12%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Kanban Demo UI */}
                {selectedDemo.previewType === 'kanban' && (
                  <div className="p-5 bg-slate-900/90 rounded-2xl border border-indigo-500/30 text-white shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-bold">Sprint Tasks</h4>
                      <span className="text-xs text-indigo-300 font-semibold bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        3 of 3 Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">To Do (1)</span>
                        <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                          <p className="font-semibold">ZIP Exporter</p>
                          <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300">Feature</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">In Progress (1)</span>
                        <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                          <p className="font-semibold">Diff Review UI</p>
                          <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300">High</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Done (1)</span>
                        <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                          <p className="font-semibold">Gemini 2.5 API</p>
                          <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300">Core</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Weather Demo UI */}
                {selectedDemo.previewType === 'weather' && (
                  <div className="p-6 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 rounded-2xl border border-cyan-500/30 text-white shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-cyan-400">Real-time Weather</span>
                        <h4 className="text-2xl font-black">San Francisco</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Partly Cloudy • Humidity 64%</p>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-extrabold">72°</span>
                        <p className="text-[11px] text-cyan-300">AQI: 28 (Good)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-6">
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Mon</div>
                        <div className="text-base my-0.5">☀️</div>
                        <div className="text-xs font-bold">74°</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Tue</div>
                        <div className="text-base my-0.5">⛅</div>
                        <div className="text-xs font-bold">69°</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Wed</div>
                        <div className="text-base my-0.5">🌧️</div>
                        <div className="text-xs font-bold">65°</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Thu</div>
                        <div className="text-base my-0.5">🌤️</div>
                        <div className="text-xs font-bold">71°</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Portfolio Demo UI */}
                {selectedDemo.previewType === 'portfolio' && (
                  <div className="p-6 bg-slate-900/90 rounded-2xl border border-purple-500/30 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-cyan-400 p-0.5">
                        <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xl text-purple-300">
                          AR
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black">Alex Rivera</h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                            Available
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Full-Stack AI Developer & Design Engineer</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                      Crafting high-speed web experiences with React, Tailwind, and generative AI models.
                    </p>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleLaunch}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow cursor-pointer"
                      >
                        Explore Projects
                      </button>
                      <button
                        onClick={handleLaunch}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full font-mono text-xs overflow-x-auto bg-[#080811] p-4 rounded-xl border border-slate-800/80">
                <pre className="text-slate-300 leading-relaxed">
                  <code>{selectedDemo.codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Footer CTA in Sandbox */}
          <div className="px-6 py-4 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Want to customize this or create your own from scratch?
            </div>
            <button
              onClick={handleLaunch}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:scale-105 active:scale-95 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Open in Studio IDE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. COMPARISON TABLE */}
      {/* ========================================================================= */}
      <section id="comparison" className="relative z-10 py-24 bg-[#0a0a14]/60 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
              Why PromptToCode
            </h2>
            <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              PromptToCode vs Traditional Coding
            </p>
            <p className="mt-4 text-base text-slate-400">
              See why developers and creators prefer our focused, zero-setup in-browser AI workflow.
            </p>
          </div>

          <div className="max-w-5xl mx-auto glass-card rounded-2xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/80">
                    <th className="p-4 sm:p-5 font-bold text-slate-300">Feature & Metric</th>
                    <th className="p-4 sm:p-5 font-bold text-purple-400 bg-purple-950/40 border-x border-purple-500/20">
                      ⚡ PromptToCode
                    </th>
                    <th className="p-4 sm:p-5 font-bold text-slate-400">Traditional Coding</th>
                    <th className="p-4 sm:p-5 font-bold text-slate-400">Generic AI Chat (ChatGPT/Claude)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Setup & Installation</td>
                    <td className="p-4 sm:p-5 bg-purple-950/20 border-x border-purple-500/20 font-bold text-emerald-400">
                      0s (Runs in browser)
                    </td>
                    <td className="p-4 sm:p-5 text-slate-400">30–60 min (Node, Git, IDE)</td>
                    <td className="p-4 sm:p-5 text-slate-400">No runtime (Only chat text)</td>
                  </tr>

                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Live Execution Preview</td>
                    <td className="p-4 sm:p-5 bg-purple-950/20 border-x border-purple-500/20 font-bold text-emerald-400">
                      Instant Sandpack Sandbox
                    </td>
                    <td className="p-4 sm:p-5 text-slate-400">Local Dev Server required</td>
                    <td className="p-4 sm:p-5 text-slate-400">❌ None</td>
                  </tr>

                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Cost & Pricing</td>
                    <td className="p-4 sm:p-5 bg-purple-950/20 border-x border-purple-500/20 font-bold text-cyan-300">
                      100% Free (BYO Key)
                    </td>
                    <td className="p-4 sm:p-5 text-slate-400">Free, but steep learning curve</td>
                    <td className="p-4 sm:p-5 text-slate-400">$20 / month subscription</td>
                  </tr>

                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Visual Diff & Hunk Staging</td>
                    <td className="p-4 sm:p-5 bg-purple-950/20 border-x border-purple-500/20 font-bold text-emerald-400">
                      ✅ Line-by-line review
                    </td>
                    <td className="p-4 sm:p-5 text-slate-400">Git CLI manual diffs</td>
                    <td className="p-4 sm:p-5 text-slate-400">❌ Overwrites or loose snippets</td>
                  </tr>

                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Self-Healing Auto-Fix</td>
                    <td className="p-4 sm:p-5 bg-purple-950/20 border-x border-purple-500/20 font-bold text-emerald-400">
                      ✅ Automated error triage
                    </td>
                    <td className="p-4 sm:p-5 text-slate-400">Manual debugging & Stack Overflow</td>
                    <td className="p-4 sm:p-5 text-slate-400">Reprompting back and forth</td>
                  </tr>

                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Multi-File Project Architecture</td>
                    <td className="p-4 sm:p-5 bg-purple-950/20 border-x border-purple-500/20 font-bold text-emerald-400">
                      ✅ Complete file tree
                    </td>
                    <td className="p-4 sm:p-5 text-slate-300">✅ Supported</td>
                    <td className="p-4 sm:p-5 text-slate-400">❌ Single snippet markdown</td>
                  </tr>

                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">Privacy & Telemetry</td>
                    <td className="p-4 sm:p-5 bg-purple-950/20 border-x border-purple-500/20 font-bold text-cyan-300">
                      🔒 100% Local (IndexedDB)
                    </td>
                    <td className="p-4 sm:p-5 text-slate-300">🔒 Local</td>
                    <td className="p-4 sm:p-5 text-slate-400">⚠️ Logged on central servers</td>
                  </tr>

                  <tr>
                    <td className="p-4 sm:p-5 font-semibold text-white">One-Click Production Export</td>
                    <td className="p-4 sm:p-5 bg-purple-950/20 border-x border-purple-500/20 font-bold text-emerald-400">
                      📦 Full Vite ZIP bundle
                    </td>
                    <td className="p-4 sm:p-5 text-slate-300">Manual Git push</td>
                    <td className="p-4 sm:p-5 text-slate-400">❌ Copy paste file by file</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TESTIMONIALS */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
            Developer Love
          </h2>
          <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Loved by frontend devs, founders, and learners
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Testimonial 1 */}
          <div className="glass-card rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed italic mb-6">
                "PromptToCode cut my initial prototyping phase from 4 hours to 4 minutes. The side-by-side diff review gives me the exact confidence I need before merging changes."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                SL
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Sarah Lin</h4>
                <p className="text-xs text-slate-400">Senior Frontend Engineer</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="glass-card rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed italic mb-6">
                "Being able to bring my own Gemini API key means zero monthly subscription fees and complete privacy for client prototypes. The one-click ZIP export works out of the box."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white">
                MK
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Marcus Keller</h4>
                <p className="text-xs text-slate-400">Indie Hacker & SaaS Founder</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="glass-card rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed italic mb-6">
                "Learn Mode is a game-changer for my students. Rather than just copying code, they see the architectural explanations and take quizzes on the generated React hooks."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-xs text-white">
                ED
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Elena Diaz</h4>
                <p className="text-xs text-slate-400">Coding Bootcamp Lead Instructor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section id="faq" className="relative z-10 py-24 bg-[#0a0a14]/60 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">
              Got Questions?
            </h2>
            <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is PromptToCode really 100% free?',
                a: 'Yes! PromptToCode is completely free with no hidden charges, subscriptions, or paywalls. You connect your own free Google Gemini API key and execute code directly in your browser.'
              },
              {
                q: 'What is a Gemini API key and where do I get one?',
                a: 'A Gemini API key is provided for free by Google AI Studio (aistudio.google.com). Google offers generous free tier rate limits (15 requests per minute for Gemini Flash), which is more than enough for extensive coding sessions.'
              },
              {
                q: 'Is my code and API key private and secure?',
                a: 'Absolutely. PromptToCode operates 100% client-side. Your API key and code snapshots are stored locally in your browser’s IndexedDB storage and are sent directly to Google Gemini’s official endpoints over HTTPS. No intermediate servers store your projects.'
              },
              {
                q: 'Which frameworks and styling libraries are supported?',
                a: 'PromptToCode specializes in React 19 / 18 and modern Vanilla JavaScript with Tailwind CSS. It supports modular multi-file architectures, custom CSS, Lucide icons, and Sandpack-powered package imports.'
              },
              {
                q: 'Can I export the generated code and run it locally?',
                a: 'Yes! Click the "Export ZIP" button at any time to download a complete, structured Vite + React project. Simply run "npm install" and "npm run dev" locally or push the folder to GitHub/Vercel/Netlify.'
              }
            ].map((item, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <span className="font-bold text-base sm:text-lg text-white">
                      {item.q}
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-purple-400 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-purple-950/60' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-6 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FINAL CTA BANNER */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-14 lg:p-16 overflow-hidden border border-purple-500/30 shadow-2xl bg-gradient-to-b from-[#141029] via-[#0f0e20] to-[#0b0b14]">
          {/* Aurora Glows inside Banner */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Ready to build your next web app in minutes?
            </h2>
            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              No credit cards. No signups. Just open your browser, enter your prompt, and watch your vision turn into clean, working React code.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleLaunch}
                className="glow-btn w-full sm:w-auto px-9 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-base shadow-2xl shadow-purple-600/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-cyan-200" />
                <span>Start Building Free Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              ⚡ Free tier available • Works with Gemini Flash & Pro models
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-white/10 bg-[#080810] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Brand */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-400 p-[1.5px]">
                  <div className="h-full w-full bg-[#0b0b14] rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Prompt<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">ToCode</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                The free in-browser AI IDE that turns natural language and UI mockups into interactive React & Vanilla JS applications.
              </p>
              <div className="flex items-center gap-3 text-slate-400 text-xs pt-2">
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                  React 19
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                  Tailwind CSS v4
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                  Gemini AI
                </span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
                Product
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    How it Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('demo')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    Interactive Demo
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('comparison')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    Comparison
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleLaunch}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Launch Studio <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Resources & Privacy */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
                Resources & Security
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-purple-400 transition-colors flex items-center gap-1"
                  >
                    Get Gemini API Key <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <span className="text-slate-500 text-xs">
                    Client-Side Execution (Zero Telemetry)
                  </span>
                </li>
                <li>
                  <span className="text-slate-500 text-xs">
                    IndexedDB Local Storage
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} PromptToCode. Built for developers worldwide.</p>
            <p>100% Free & Open Client-Side Architecture</p>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* FLOATING BACK TO TOP BUTTON */}
      {/* ========================================================================= */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-slate-900/90 hover:bg-purple-600 text-white border border-purple-500/40 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group"
          title="Back to Top"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}
