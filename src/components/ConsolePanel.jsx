import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useConsoleStore } from '../store/useConsoleStore';
import { useChatStore } from '../store/useChatStore';

export default function ConsolePanel() {
  const { logs, clearLogs, getRecentErrors } = useConsoleStore();
  const { isStreaming, sendFixRequest } = useChatStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const logsEndRef = useRef(null);

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  // Auto-scroll to the latest log entry
  useEffect(() => {
    if (isExpanded) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const handleFixError = (targetError) => {
    if (isStreaming) return;
    const recent = useConsoleStore.getState().getRecentErrors(3);
    // Ensure the clicked error is first
    const otherRecent = recent.filter((e) => e.signature !== targetError.signature);
    const errorsToSend = [targetError, ...otherRecent].slice(0, 3);
    sendFixRequest(errorsToSend);
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
      case 'warn':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'info':
        return <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />;
    }
  };

  const getLogRowStyle = (level) => {
    switch (level) {
      case 'error':
        return 'bg-rose-950/30 text-rose-200 border-l-2 border-rose-500';
      case 'warn':
        return 'bg-amber-950/20 text-amber-200 border-l-2 border-amber-500';
      case 'info':
        return 'bg-sky-950/20 text-sky-200 border-l-2 border-sky-500';
      default:
        return 'text-slate-300 hover:bg-slate-900/60 border-l-2 border-transparent';
    }
  };

  return (
    <div className="flex flex-col border-t border-slate-800 bg-slate-950 select-none">
      {/* Console Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 text-xs">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 font-mono text-slate-300 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Console</span>
          </div>

          {/* Counts */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
              {logs.length}
            </span>

            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 border border-rose-700/60 font-mono font-medium">
                {errorCount} {errorCount === 1 ? 'error' : 'errors'}
              </span>
            )}

            {warnCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-700/60 font-mono font-medium">
                {warnCount} {warnCount === 1 ? 'warn' : 'warns'}
              </span>
            )}
          </div>
        </button>

        {/* Console Actions */}
        <div className="flex items-center gap-1">
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Log Body */}
      {isExpanded && (
        <div className="h-36 overflow-y-auto p-2 font-mono text-[11px] space-y-1 bg-slate-950">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-sans">
              No console output yet
            </div>
          ) : (
            logs.map((log) => {
              const isScriptError = log.message === 'Script error.';
              const isRunnerError = log.kind === 'runner' || !log.file;
              const isUnfixable = isScriptError || isRunnerError;

              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 px-2 py-1 rounded transition-colors ${getLogRowStyle(
                    log.level
                  )}`}
                >
                  {getLogIcon(log.level)}

                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {log.timestamp}
                  </span>

                  <div className="flex-1 min-w-0 break-all whitespace-pre-wrap leading-relaxed">
                    {log.message}
                    {log.file && (
                      <span className="text-[10px] text-rose-400 ml-1.5">
                        [{log.file}{log.line ? `:${log.line}` : ''}]
                      </span>
                    )}
                  </div>

                  {/* Fix with AI Button */}
                  {log.level === 'error' && (
                    <button
                      onClick={() => handleFixError(log)}
                      disabled={isStreaming || isUnfixable}
                      title={
                        isUnfixable
                          ? 'This looks like a preview problem, not a code problem'
                          : 'Ask AI to analyze and fix this error'
                      }
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans shrink-0 ml-2 transition-all cursor-pointer ${
                        isStreaming
                          ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                          : isUnfixable
                          ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white shadow-xs'
                      }`}
                    >
                      {isStreaming ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" />
                          <span>Fixing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-2.5 h-2.5 text-indigo-200" />
                          <span>Fix with AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
