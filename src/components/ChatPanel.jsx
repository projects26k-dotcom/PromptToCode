import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Trash2,
  Key,
  Bot,
  Zap,
  Gamepad2,
  CheckSquare,
  LayoutTemplate,
  Atom,
  AlertTriangle,
  ArrowRight,
  Lock,
  ImagePlus,
  UploadCloud
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useProjectsStore } from '../store/useProjectsStore';
import { useSnapshotStore } from '../store/useSnapshotStore';
import { cleanPastedMarkdown } from '../lib/cleanMarkdown';
import ChatMessage from './ChatMessage';
import ImageAttachments from './ImageAttachments';
import LearnToggle from './LearnToggle';
import PlanToggle from './PlanToggle';

export default function ChatPanel() {
  const previewingSnapshot = useSnapshotStore((state) => state.previewingSnapshot);
  const {
    messages,
    isStreaming,
    error,
    promptConfirmation,
    pendingImages,
    isProcessingImage,
    attachImages,
    sendMessage,
    confirmPromptType,
    cancelPromptConfirmation,
    stopStreaming,
    clearChat,
  } = useChatStore();

  const { geminiKey, selectedModel, openSettings } = useSettingsStore();
  const { currentProjectType } = useProjectsStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : inputPrompt;
    if ((!text.trim() && pendingImages.length === 0) || isStreaming || isProcessingImage) return;
    sendMessage(text);
    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInputPrompt(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      attachImages(e.dataTransfer.files);
    }
  };

  // Clipboard Paste handler (Ctrl+V of screenshot or ChatGPT/markdown text)
  const handlePaste = (e) => {
    // 1. Attached image handling
    const items = e.clipboardData?.items;
    if (items) {
      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        attachImages(imageFiles);
        return;
      }
    }

    // 2. Formatted markdown / ChatGPT paste cleaning
    const pastedText = e.clipboardData?.getData('text/plain');
    if (!pastedText) return;

    const cleanedText = cleanPastedMarkdown(pastedText);

    if (cleanedText !== pastedText) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const currentVal = textarea.value;
        const newVal = currentVal.substring(0, start) + cleanedText + currentVal.substring(end);

        setInputPrompt(newVal);

        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + cleanedText.length;
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
          }
        });
      } else {
        setInputPrompt((prev) => prev + cleanedText);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      attachImages(e.target.files);
      e.target.value = ''; // Reset input to allow re-selecting same file
    }
  };

  const starterPrompts = currentProjectType === 'react'
    ? [
        {
          title: 'Build a React Counter & Timer',
          description: 'Stateful stopwatch with start/pause/reset buttons',
          icon: <Atom className="w-3.5 h-3.5 text-sky-400" />,
          prompt: 'Create an animated React Stopwatch and Timer component with start, pause, lap tracking, and neon styling.',
        },
        {
          title: 'Build a React Weather App',
          description: 'Interactive forecast cards with search and animated icons',
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
          prompt: 'Build a modern React Weather Dashboard with interactive city search, animated temperature cards, and 5-day forecast.',
        },
        {
          title: 'Build a React Kanban Board',
          description: 'Task board with columns, card reordering, and tags',
          icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />,
          prompt: 'Build a clean React Kanban board with Todo, In Progress, Done columns, task creation, and tag filtering.',
        },
      ]
    : [
        {
          title: 'Make a todo app',
          description: 'Interactive tasks with local storage & filters',
          icon: <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />,
          prompt: 'Make a modern, responsive Todo app with smooth animations, local storage persistence, task filters, and glassmorphism styling.',
        },
        {
          title: 'Create a landing page',
          description: 'Hero section, feature grid, and pricing cards',
          icon: <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />,
          prompt: 'Create a sleek dark-themed SaaS landing page with a dynamic animated hero section, feature cards, and interactive pricing toggles.',
        },
        {
          title: 'Build a snake game',
          description: 'Retro arcade game with score tracking & controls',
          icon: <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />,
          prompt: 'Build a classic retro Snake game on an HTML5 canvas with neon graphics, keyboard controls, high score tracking, and game over restart.',
        },
      ];

  const canSend = (inputPrompt.trim().length > 0 || pendingImages.length > 0) && !isStreaming && !isProcessingImage;

  return (
    <div className="h-full w-full flex flex-col bg-slate-900 border-l border-slate-800 select-none overflow-hidden relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-300 gap-2">
        <div className="flex items-center gap-2 truncate min-w-0">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-xs shrink-0">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent truncate hidden xs:inline">
            AI Assistant
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700/60 truncate max-w-[90px]">
            {selectedModel.replace('gemini-', '')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Plan Mode Toggle */}
          <PlanToggle />

          {/* Learn Mode Toggle */}
          <LearnToggle />

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear Conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Missing Key Notification Banner */}
      {!geminiKey && (
        <div className="m-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <Key className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="text-[11px]">Gemini API key is required to use AI.</span>
          </div>
          <button
            onClick={openSettings}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            Configure Key
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/10">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>

            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Describe it. Forge it. Run it.
            </h3>
            <p className="text-xs text-slate-400 max-w-[240px] mb-6 leading-relaxed">
              Ask AI to generate {currentProjectType === 'react' ? 'React components and hooks' : 'HTML, CSS, and JS apps'}, or attach a design screenshot.
            </p>

            {/* Quick Starters */}
            <div className="w-full space-y-2 max-w-xs text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block px-1">
                {currentProjectType === 'react' ? 'React Starters' : 'Quick Starters'}
              </span>
              {starterPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group shadow-xs cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-slate-900 group-hover:bg-slate-800 shrink-0 border border-slate-800">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Messages */
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Smart Detection Confirmation Modal / Toast */}
      {promptConfirmation && (
        <div className="absolute inset-x-3 bottom-20 z-40 p-4 rounded-2xl bg-slate-900/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md animate-slideUp">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white mb-1">
                Framework Match Detected
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                {promptConfirmation.message}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => confirmPromptType('switch')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                >
                  <span>
                    Create {promptConfirmation.detectedType === 'react' ? 'React' : 'Vanilla'} Project
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => confirmPromptType('keep')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Keep {currentProjectType}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Section with Drag & Drop & Attachments */}
      <div
        className="p-3 border-t border-slate-800 bg-slate-900/90"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {previewingSnapshot ? (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-200 select-none">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>AI chat is disabled while previewing a snapshot. Exit preview to resume.</span>
          </div>
        ) : (
          <div
            className={`relative rounded-xl border transition-all ${
              isDragging
                ? 'border-indigo-400 bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-lg'
                : 'border-slate-800 bg-slate-950 focus-within:border-indigo-500/70 shadow-inner'
            }`}
          >
            {/* Drag & Drop Visual Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-20 rounded-xl bg-indigo-950/90 backdrop-blur-xs border-2 border-dashed border-indigo-400 flex flex-col items-center justify-center gap-1 pointer-events-none text-indigo-200 animate-in fade-in duration-150">
                <UploadCloud className="w-6 h-6 text-indigo-400 animate-bounce" />
                <span className="text-xs font-semibold">Drop design image here (max 3)</span>
              </div>
            )}

            {/* Thumbnail Strip */}
            <ImageAttachments />

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end p-2"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  !geminiKey
                    ? 'Set Gemini key in settings to start...'
                    : pendingImages.length > 0
                    ? 'Optional instructions (or Enter to recreate design)...'
                    : currentProjectType === 'react'
                    ? 'Describe React component or paste image... (Enter to send)'
                    : 'Describe what to build or paste image... (Enter to send)'
                }
                className="flex-1 max-h-28 bg-transparent text-xs text-white placeholder-slate-500 outline-none resize-none py-1 px-1 font-sans leading-relaxed"
              />

              {/* Attach Image Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={pendingImages.length >= 3 || isStreaming || isProcessingImage}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 shrink-0 ml-1 transition-all cursor-pointer"
                title={pendingImages.length >= 3 ? 'Max 3 images attached' : 'Attach screenshot/image (PNG, JPEG, WebP)'}
              >
                <ImagePlus className="w-4 h-4" />
              </button>

              {/* Send / Stop Button */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shrink-0 ml-1 transition-all shadow-sm animate-pulse cursor-pointer"
                  title="Stop Generation"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shrink-0 ml-1 transition-all shadow-sm cursor-pointer"
                  title="Send Prompt (Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        )}
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
          <span>Shift+Enter newline • Paste/drop images</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="capitalize">{currentProjectType} Mode</span>
          </span>
        </div>
      </div>
    </div>
  );
}

