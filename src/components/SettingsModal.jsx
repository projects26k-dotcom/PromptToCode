import React, { useState, useEffect } from 'react';
import { X, Key, Shield, ExternalLink, Eye, EyeOff, Sparkles, Check, GitPullRequest, Image as ImageIcon } from 'lucide-react';
import { useSettingsStore, MODEL_GROUPS } from '../store/useSettingsStore';

export default function SettingsModal() {
  const {
    geminiKey,
    selectedModel,
    autoApply,
    autoFix,
    autoImages,
    isSettingsOpen,
    setGeminiKey,
    setModel,
    setAutoApply,
    setAutoFix,
    setAutoImages,
    closeSettings,
  } = useSettingsStore();

  const [inputKey, setInputKey] = useState('');
  const [model, setLocalModel] = useState(selectedModel);
  const [localAutoApply, setLocalAutoApply] = useState(autoApply);
  const [localAutoFix, setLocalAutoFix] = useState(autoFix);
  const [localAutoImages, setLocalAutoImages] = useState(autoImages);
  const [showPassword, setShowPassword] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      setInputKey(geminiKey);
      setLocalModel(selectedModel);
      setLocalAutoApply(autoApply);
      setLocalAutoFix(autoFix);
      setLocalAutoImages(autoImages);
      setSavedNotice(false);
    }
  }, [isSettingsOpen, geminiKey, selectedModel, autoApply, autoFix, autoImages]);

  if (!isSettingsOpen) return null;

  const handleSave = (e) => {
    e?.preventDefault();
    setGeminiKey(inputKey);
    setModel(model);
    setAutoApply(localAutoApply);
    setAutoFix(localAutoFix);
    setAutoImages(localAutoImages);
    setSavedNotice(true);
    setTimeout(() => {
      closeSettings();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Key className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Settings</h2>
              <p className="text-[11px] text-slate-400">Configure Gemini API key & preferences</p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                <span>Get key from Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 pr-10 text-xs font-mono text-white placeholder-slate-600 outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-slate-500 hover:text-slate-300 p-1 transition-colors cursor-pointer"
                title={showPassword ? 'Hide Key' : 'Show Key'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Model Selection Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all cursor-pointer font-mono"
            >
              {MODEL_GROUPS.map((group) => (
                <optgroup
                  key={group.group}
                  label={group.group}
                  className="bg-slate-900 text-indigo-400 font-semibold text-xs"
                >
                  {group.models.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      className="bg-slate-950 text-slate-200 py-1 font-normal font-mono text-xs"
                    >
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Auto-Apply Diff Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-start gap-2.5">
              <GitPullRequest className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Auto-apply AI changes</p>
                <p className="text-[11px] text-slate-400">
                  Directly apply code edits without reviewing diffs
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={localAutoApply}
                onChange={(e) => setLocalAutoApply(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Auto-Fix Errors Toggle */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Auto-fix errors</p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    When on, PromptToCode will automatically ask the AI to fix preview errors (max 2 tries per error). You still review every change before it is applied unless auto-apply is also on.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                <input
                  type="checkbox"
                  checked={localAutoFix}
                  onChange={(e) => setLocalAutoFix(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Loop Warning if both Auto-Fix and Auto-Apply are active */}
            {localAutoFix && localAutoApply && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px]">
                <span className="font-semibold text-amber-400 shrink-0">⚠️ Warning:</span>
                <span>Both on can loop. Max 2 attempts per error.</span>
              </div>
            )}
          </div>

          {/* Auto Images Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-start gap-2.5">
              <ImageIcon className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Auto images</p>
                <p className="text-[11px] text-slate-400">
                  Generate contextual photos and artwork using Pollinations AI
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
              <input
                type="checkbox"
                checked={localAutoImages}
                onChange={(e) => setLocalAutoImages(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Your API key is stored <strong className="text-slate-200 font-medium">only in your browser's local storage</strong>. It is sent directly to Google's official Gemini endpoint.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeSettings}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
            >
              {savedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
