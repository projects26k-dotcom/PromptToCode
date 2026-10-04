import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Play,
  Atom,
  Terminal,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  Zap,
  Layers,
  Sparkles,
  Loader2,
  Eye
} from 'lucide-react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
  useSandpack
} from '@codesandbox/sandpack-react';
import { useProjectStore } from '../store/useProjectStore';
import { useProjectsStore } from '../store/useProjectsStore';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useConsoleStore } from '../store/useConsoleStore';
import { usePendingStore } from '../store/usePendingStore';
import { useSnapshotStore } from '../store/useSnapshotStore';
import { buildPreviewHtml } from '../lib/runner/buildPreview';
import { buildReactPreviewHtml } from '../lib/runner/buildReactPreview';
import { sanitizeSandpackFiles } from '../lib/runner/sandpackFiles';
import SandpackErrorBoundary from './SandpackErrorBoundary';
import ConsolePanel from './ConsolePanel';
import ErrorBanner from './ErrorBanner';

/**
 * Hook to watch Sandpack status and trigger timeout banner if stalled.
 */
function SandpackStatusWatcher({ onBlocked, onActive }) {
  const { sandpack } = useSandpack();
  const status = sandpack?.status;

  useEffect(() => {
    if (status === 'running') {
      onActive();
    } else if (status === 'timeout') {
      onBlocked();
    }
  }, [status, onBlocked, onActive]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status !== 'running') {
        onBlocked();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [status, onBlocked]);

  return null;
}

export default function PreviewPanel() {
  const { files } = useProjectStore();
  const { currentProjectType } = useProjectsStore();
  const { isStreaming, sendFixRequest } = useChatStore();
  const { reactRunnerMode, setReactRunnerMode, autoFix } = useSettingsStore();
  const { clearLogs, addLog, latestError, getFixAttempts, dismissError } = useConsoleStore();
  const { pending } = usePendingStore();
  const { previewingSnapshot, exitPreview, openRestoreDialog } = useSnapshotStore();

  const activeFiles = previewingSnapshot ? previewingSnapshot.files : files;

  const iframeRef = useRef(null);
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [previewHtml, setPreviewHtml] = useState(() => 
    currentProjectType === 'react' ? buildReactPreviewHtml(activeFiles) : buildPreviewHtml(activeFiles)
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [isReactConsoleOpen, setIsReactConsoleOpen] = useState(true);
  const [sandpackKey, setSandpackKey] = useState(0);
  const [isSandpackBlocked, setIsSandpackBlocked] = useState(false);

  const prevStreamingRef = useRef(isStreaming);

  // Active runner determination
  const isBuiltinRunner = currentProjectType === 'vanilla' || (currentProjectType === 'react' && reactRunnerMode === 'builtin');

  // 1. Listen for postMessage from the iframe console bridge (Vanilla or Built-in React mode)
  useEffect(() => {
    if (!isBuiltinRunner) return;

    const handleMessage = (event) => {
      if (
        event.data &&
        (event.data.source === 'prompttocode-preview' || event.data.source === 'vibeforge-preview')
      ) {
        if (event.data.type === 'ready') {
          dismissError();
          return;
        }

        let { kind, file, message, line, column, stack, level } = event.data;
        const isError = level === 'error' || event.data.type === 'error';

        if (isError) {
          const projectFiles = useProjectStore.getState().files || {};
          const fileKeys = Object.keys(projectFiles);

          // If file is empty or not in project, inspect stack and message
          if (!file && stack) {
            for (const key of fileKeys) {
              const base = key.replace(/^\//, '');
              if (
                stack.includes(`[as ${base}]`) ||
                stack.includes(`[as ${key}]`) ||
                stack.includes(key) ||
                stack.includes(base) ||
                (message && (message.includes(key) || message.includes(base)))
              ) {
                file = key.startsWith('/') ? key : `/${key}`;
                kind = 'runtime';
                break;
              }
            }
          }

          if (file) {
            if (!kind || kind === 'runner') kind = 'runtime';
          } else {
            kind = 'runner';
          }

          // Dev diagnostic logging (development mode only)
          if (import.meta.env?.DEV) {
            console.log('[PromptToCode Preview Bridge Error]:', {
              kind,
              file,
              message,
              line,
              column,
              stack: (stack || '').slice(0, 200),
            });
          }

          addLog({
            level: 'error',
            kind,
            message: message || '',
            file: file || '',
            line,
            column,
            stack: stack || '',
          });
          return;
        }

        addLog({
          level: event.data.level || 'log',
          kind: event.data.kind,
          message: event.data.message || '',
          file: event.data.file || '',
          line: event.data.line,
          column: event.data.column,
          stack: event.data.stack || '',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog, dismissError, isBuiltinRunner]);

  // 2. Automated Fix Watcher (when autoFix setting is enabled)
  useEffect(() => {
    if (!autoFix || !latestError || isStreaming) return;

    // Ignore cross-origin script errors
    if (latestError.message === 'Script error.') return;

    // Never auto-fix when pending changes exist
    if (Object.keys(pending).length > 0) return;

    const attempts = getFixAttempts(latestError.signature);
    if (attempts >= 2) return; // Max 2 automatic fix attempts

    const timer = setTimeout(() => {
      const currentStreaming = useChatStore.getState().isStreaming;
      const currentPending = usePendingStore.getState().pending;
      const currentAttempts = useConsoleStore.getState().getFixAttempts(latestError.signature);

      if (
        !currentStreaming &&
        Object.keys(currentPending).length === 0 &&
        currentAttempts < 2
      ) {
        sendFixRequest(latestError, false, true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [autoFix, latestError, isStreaming, pending, getFixAttempts, sendFixRequest]);

  // 3. Debounce HTML updates on local file edits, immediate update on AI stream completion
  useEffect(() => {
    if (!isBuiltinRunner) return;

    const generateHtml = () => {
      return currentProjectType === 'react'
        ? buildReactPreviewHtml(activeFiles)
        : buildPreviewHtml(activeFiles);
    };

    if (prevStreamingRef.current && !isStreaming) {
      clearLogs();
      setPreviewHtml(generateHtml());
      setReloadKey((k) => k + 1);
      prevStreamingRef.current = isStreaming;
      return;
    }
    prevStreamingRef.current = isStreaming;

    if (isStreaming) return;

    const timeout = setTimeout(() => {
      clearLogs();
      setPreviewHtml(generateHtml());
      setReloadKey((k) => k + 1);
    }, 600);

    return () => clearTimeout(timeout);
  }, [activeFiles, isStreaming, clearLogs, currentProjectType, isBuiltinRunner]);

  // Force reload handler
  const handleReload = () => {
    if (currentProjectType === 'react' && reactRunnerMode === 'sandpack') {
      setIsSandpackBlocked(false);
      setSandpackKey((k) => k + 1);
    } else {
      clearLogs();
      setPreviewHtml(
        currentProjectType === 'react'
          ? buildReactPreviewHtml(activeFiles)
          : buildPreviewHtml(activeFiles)
      );
      setReloadKey((k) => k + 1);
    }
  };

  // Open in new tab handler
  const handleOpenNewTab = () => {
    const html = currentProjectType === 'react' && reactRunnerMode === 'builtin'
      ? buildReactPreviewHtml(activeFiles)
      : buildPreviewHtml(activeFiles);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Sanitize files for Sandpack React engine
  const { files: sandpackFiles, warnings: sandpackWarnings } = useMemo(() => {
    if (currentProjectType !== 'react') return { files: {}, warnings: [] };
    return sanitizeSandpackFiles(activeFiles);
  }, [activeFiles, currentProjectType]);

  const handleSandpackTimeout = useCallback(() => {
    setIsSandpackBlocked(true);
  }, []);

  const handleSandpackActive = useCallback(() => {
    setIsSandpackBlocked(false);
  }, []);

  // Container width style based on device mode
  const getContainerWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-900 border-l border-slate-800 select-none overflow-hidden">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/95 text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold">
            {currentProjectType === 'react' ? (
              <>
                <Atom className="w-3.5 h-3.5 text-sky-400" />
                <span>React Preview</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                <span>Live Preview</span>
              </>
            )}
          </div>

          {/* React Runner Mode Toggle (Sandpack vs Built-in) */}
          {currentProjectType === 'react' && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 ml-1">
              <button
                onClick={() => setReactRunnerMode('sandpack')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  reactRunnerMode === 'sandpack'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Use CodeSandbox Sandpack bundler"
              >
                <Layers className="w-3 h-3" />
                <span>Sandpack</span>
              </button>
              <button
                onClick={() => setReactRunnerMode('builtin')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  reactRunnerMode === 'builtin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Use standalone built-in React runner (Babel standalone, offline/firewall safe)"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Built-in</span>
              </button>
            </div>
          )}
        </div>

        {/* Device Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              deviceMode === 'desktop'
                ? 'bg-slate-800 text-indigo-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Desktop view (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              deviceMode === 'tablet'
                ? 'bg-slate-800 text-indigo-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Tablet view (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-slate-800 text-indigo-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Mobile view (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {latestError && latestError.file && latestError.kind !== 'runner' && latestError.message !== 'Script error.' && (
            <button
              onClick={() => {
                const currentErr = useConsoleStore.getState().latestError;
                if (currentErr) sendFixRequest(currentErr);
              }}
              disabled={isStreaming}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-xs ${
                isStreaming
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/40 shadow-purple-900/30'
              }`}
              title="Fix active error with AI"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-purple-200" />
                  <span>Fixing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-purple-200" />
                  <span>Fix with AI</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleReload}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reload Preview"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenNewTab}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sandpack Blocked Banner */}
      {currentProjectType === 'react' && reactRunnerMode === 'sandpack' && isSandpackBlocked && (
        <div className="px-3 py-2 bg-amber-950/90 border-b border-amber-600/50 text-amber-200 text-xs flex items-center justify-between gap-2 shrink-0 animate-fadeIn select-none">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sandpack could not load (possibly blocked by an extension or network). Switch to the built-in runner?</span>
          </div>
          <button
            onClick={() => setReactRunnerMode('builtin')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Zap className="w-3 h-3" />
            <span>Use built-in runner</span>
          </button>
        </div>
      )}

      {/* Snapshot Preview Active Banner */}
      {previewingSnapshot && (
        <div className="px-3.5 py-2 bg-indigo-950/95 border-b border-indigo-500/60 text-indigo-200 text-xs flex items-center justify-between gap-2 shrink-0 animate-in fade-in select-none shadow-md z-20">
          <div className="flex items-center gap-2 truncate">
            <Eye className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate font-medium">
              Previewing: <strong className="text-white font-semibold">{previewingSnapshot.label}</strong>{' '}
              <span className="text-[10px] text-indigo-300 font-mono">({previewingSnapshot.fileCount || Object.keys(previewingSnapshot.files || {}).length} files)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => openRestoreDialog(previewingSnapshot)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore this version</span>
            </button>
            <button
              onClick={exitPreview}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer border border-slate-700"
            >
              Exit preview
            </button>
          </div>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="flex-1 min-h-0 w-full bg-slate-950 flex items-center justify-center overflow-hidden p-2">
        <div
          className={`h-full ${getContainerWidth()} w-full flex-1 min-h-0 transition-all duration-300 rounded-lg overflow-hidden bg-slate-950 relative border border-slate-800/80 shadow-xl flex flex-col`}
        >
          {/* Error Banner shown over the preview */}
          <ErrorBanner onReload={handleReload} />

          {currentProjectType === 'react' && reactRunnerMode === 'sandpack' ? (
            /* React Sandpack Runner wrapped in ErrorBoundary */
            <SandpackErrorBoundary onReset={() => setSandpackKey((k) => k + 1)}>
              <SandpackProvider
                key={sandpackKey}
                template="react"
                theme="dark"
                files={sandpackFiles}
                options={{
                  initMode: 'immediate',
                  recompileMode: 'delayed',
                  recompileDelay: 600,
                }}
                className="h-full w-full flex-1 min-h-0 flex flex-col [&_.sp-wrapper]:h-full [&_.sp-layout]:h-full [&_.sp-layout]:border-none [&_.sp-preview]:h-full [&_.sp-preview-container]:h-full [&_.sp-preview-iframe]:h-full"
                style={{ height: '100%', width: '100%' }}
              >
                <SandpackStatusWatcher
                  onBlocked={handleSandpackTimeout}
                  onActive={handleSandpackActive}
                />

                <div className="flex-1 min-h-0 h-full w-full overflow-hidden flex flex-col">
                  <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton={false}
                    className="h-full w-full flex-1 min-h-0"
                    style={{ height: '100%' }}
                  />
                </div>

                {/* React Sandpack Console Drawer */}
                <div className="border-t border-slate-800 bg-slate-950 select-none shrink-0">
                  {sandpackWarnings.length > 0 && (
                    <div className="px-3 py-1 bg-amber-950/60 border-b border-amber-800/60 text-amber-300 text-[10px] flex items-center gap-1.5 font-mono">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>{sandpackWarnings[0]}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 text-xs">
                    <button
                      onClick={() => setIsReactConsoleOpen(!isReactConsoleOpen)}
                      className="flex items-center gap-2 font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {isReactConsoleOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        <Terminal className="w-3.5 h-3.5 text-sky-400" />
                        <span>React Console</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setSandpackKey((k) => k + 1)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Clear / Restart Console"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isReactConsoleOpen && (
                    <div className="h-36 overflow-y-auto bg-slate-950 font-mono text-[11px] [&_.sp-console]:h-full [&_.sp-console]:bg-transparent">
                      <SandpackConsole
                        resetOnPreviewRestart
                        className="h-full w-full bg-slate-950"
                      />
                    </div>
                  )}
                </div>
              </SandpackProvider>
            </SandpackErrorBoundary>
          ) : (
            /* Standalone Iframe Runner (Vanilla or Built-in React) */
            <iframe
              key={reloadKey}
              ref={iframeRef}
              srcDoc={previewHtml}
              title="PromptToCode Preview"
              sandbox="allow-scripts allow-modals allow-forms allow-popups"
              className="h-full w-full flex-1 min-h-0 border-0 bg-slate-950"
              style={{ height: '100%', width: '100%' }}
            />
          )}
        </div>
      </div>

      {/* Console Drawer for Vanilla and Built-in React Runner */}
      {isBuiltinRunner && <ConsolePanel />}
    </div>
  );
}
