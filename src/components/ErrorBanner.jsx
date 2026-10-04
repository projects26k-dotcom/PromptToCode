import React from 'react';
import { AlertTriangle, Sparkles, X, Loader2, RotateCcw } from 'lucide-react';
import { useConsoleStore } from '../store/useConsoleStore';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../store/useSettingsStore';

export default function ErrorBanner({ onReload }) {
  const latestError = useConsoleStore((state) => state.latestError);
  const dismissError = useConsoleStore((state) => state.dismissError);
  const fixAttempts = useConsoleStore((state) => state.fixAttempts);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const sendFixRequest = useChatStore((state) => state.sendFixRequest);
  const maxFixAttempts = useSettingsStore((state) => state.maxFixAttempts || 3);

  if (!latestError) return null;

  const signature = latestError.signature || '';
  const attempts = (signature && fixAttempts[signature]) || 0;
  const isScriptError = latestError.message === 'Script error.';
  const isRunnerError = latestError.kind === 'runner' || !latestError.file;
  const isUnfixable = isScriptError || isRunnerError;
  const needsMoreContext = attempts >= maxFixAttempts;

  const handleFix = () => {
    const currentErr = useConsoleStore.getState().latestError;
    if (!currentErr || isStreaming || isUnfixable) return;
    sendFixRequest(currentErr, needsMoreContext);
  };

  // Clean short error message for header
  const shortMsg = (latestError.message || 'Unknown error')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 100);

  return (
    <div className="relative z-30 flex items-center justify-between gap-3 px-3.5 py-2 bg-rose-950/95 border-b border-rose-800/80 text-rose-200 text-xs backdrop-blur-md shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-rose-300 shrink-0">
            {attempts > 0 ? `Still failing (attempt ${attempts + 1}):` : 'Your app hit an error:'}
          </span>
          <span className="truncate text-rose-200/90 font-mono text-[11px]" title={latestError.message}>
            {shortMsg}
          </span>
          {latestError.file && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 font-mono border border-rose-800/50">
              {latestError.file}{latestError.line ? `:${latestError.line}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isRunnerError ? (
          <button
            onClick={onReload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all cursor-pointer"
            title="Reload the preview"
          >
            <RotateCcw className="w-3 h-3 text-slate-300" />
            <span>Reload preview</span>
          </button>
        ) : (
          <button
            onClick={handleFix}
            disabled={isStreaming || isUnfixable}
            title={
              isUnfixable
                ? 'This looks like a preview problem, not a code problem'
                : undefined
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-[11px] shadow-sm transition-all cursor-pointer ${
              isStreaming
                ? 'bg-rose-900/60 text-rose-300 cursor-not-allowed border border-rose-800/50'
                : isUnfixable
                ? 'bg-rose-950 text-rose-400/60 border border-rose-900 cursor-not-allowed'
                : needsMoreContext
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30'
                : 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/30'
            }`}
          >
            {isStreaming ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-rose-300" />
                <span>Fixing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-rose-200" />
                <span>{needsMoreContext ? 'Try again with more context' : 'Fix with AI'}</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={dismissError}
          className="p-1 rounded-md text-rose-400 hover:text-rose-200 hover:bg-rose-900/50 transition-colors cursor-pointer"
          title="Dismiss error banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
