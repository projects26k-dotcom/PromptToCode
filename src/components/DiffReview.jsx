import React, { useState, useEffect, useRef } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  FileCode,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  Columns,
  GraduationCap,
  ChevronDown,
  Lightbulb
} from 'lucide-react';
import { usePendingStore } from '../store/usePendingStore';
import { useProjectStore } from '../store/useProjectStore';
import { useChatStore } from '../store/useChatStore';
import { cleanFilePath } from '../lib/ai/parseResponse';
import { getLanguage } from '../lib/language';
import { getDiffStats } from '../lib/diff';

export default function DiffReview() {
  const { pending, reviewingFile, acceptFile, rejectFile, updateProposed, reviewFile, closeReview } =
    usePendingStore();
  const { files } = useProjectStore();
  const messages = useChatStore((state) => state.messages);

  const [sideBySide, setSideBySide] = useState(() => window.innerWidth > 960);
  const [isWhyExpanded, setIsWhyExpanded] = useState(true);
  const diffEditorRef = useRef(null);

  // Find explanation for reviewingFile from recent assistant messages
  const fileExplanation = (() => {
    if (!reviewingFile) return null;
    const cleanCurrent = cleanFilePath(reviewingFile);
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant' && msg.explanations && msg.explanations.length > 0) {
        const found = msg.explanations.find(
          (e) => cleanFilePath(e.path) === cleanCurrent
        );
        if (found) return found;
      }
    }
    return null;
  })();

  useEffect(() => {
    const handleResize = () => {
      setSideBySide(window.innerWidth > 960);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pendingList = Object.keys(pending);
  const currentIndex = reviewingFile ? pendingList.indexOf(reviewingFile) : -1;
  const currentItem = reviewingFile ? pending[reviewingFile] : null;

  if (!reviewingFile || !currentItem) {
    return null;
  }

  // Check for local edit conflict
  const currentRealContent = files[reviewingFile] ?? '';
  const isConflict = !currentItem.isNew && currentRealContent !== currentItem.original;

  // Language for Monaco
  const language = getLanguage(reviewingFile);

  // Line stats
  const { added, removed } = getDiffStats(currentItem.original, currentItem.proposed);

  const handleEditorMount = (editor) => {
    diffEditorRef.current = editor;
    const modifiedEditor = editor.getModifiedEditor();
    if (modifiedEditor) {
      modifiedEditor.onDidChangeModelContent(() => {
        const val = modifiedEditor.getValue();
        updateProposed(reviewingFile, val);
      });
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      reviewFile(pendingList[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < pendingList.length - 1) {
      reviewFile(pendingList[currentIndex + 1]);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] select-none overflow-hidden">
      {/* Diff Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-xs gap-2 shrink-0">
        {/* Left: Back & File Info */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={closeReview}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Back to standard editor"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-1.5 font-mono text-slate-200 truncate">
            <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold truncate">{reviewingFile}</span>
          </div>

          {/* Badges */}
          {currentItem.isNew && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 shrink-0">
              New File
            </span>
          )}

          {/* Diff Stats */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 shrink-0">
            <span className="text-emerald-400 font-semibold">+{added}</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400 font-semibold">-{removed}</span>
          </div>
        </div>

        {/* Center: File Pagination */}
        {pendingList.length > 1 && (
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 font-mono text-xs text-slate-400">
            <button
              onClick={goToPrev}
              disabled={currentIndex <= 0}
              className="p-0.5 rounded hover:text-white disabled:opacity-30 cursor-pointer"
              title="Previous file"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>
              {currentIndex + 1} of {pendingList.length}
            </span>
            <button
              onClick={goToNext}
              disabled={currentIndex >= pendingList.length - 1}
              className="p-0.5 rounded hover:text-white disabled:opacity-30 cursor-pointer"
              title="Next file"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSideBySide(!sideBySide)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer hidden md:flex"
            title={sideBySide ? 'Switch to inline diff' : 'Switch to side-by-side diff'}
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => rejectFile(reviewingFile)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-xs font-medium transition-all shadow-xs cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>

          <button
            onClick={() => acceptFile(reviewingFile)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Change</span>
          </button>
        </div>
      </div>

      {/* JSON Validation Error Banner */}
      {currentItem.jsonError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-950 border-b border-rose-800 text-rose-200 text-xs font-mono">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Invalid JSON:</strong> {currentItem.jsonError}. Please edit the proposed JSON on the right side before accepting.
          </span>
        </div>
      )}

      {/* Why This Change? Learn Mode Panel */}
      {fileExplanation && (
        <div className="border-b border-slate-800 bg-slate-950/90 text-xs">
          <button
            type="button"
            onClick={() => setIsWhyExpanded(!isWhyExpanded)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-850 text-slate-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-amber-300 text-[11px]">Why this change?</span>
              <span className="text-[10px] text-slate-400 truncate max-w-md hidden sm:inline">
                — {fileExplanation.purpose}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>{isWhyExpanded ? 'Hide' : 'Show'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isWhyExpanded ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isWhyExpanded && (
            <div className="p-3 bg-slate-950 space-y-2 border-t border-slate-850 animate-in fade-in duration-150">
              {fileExplanation.purpose && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Purpose:</span>
                  <p className="text-slate-200 text-xs">{fileExplanation.purpose}</p>
                </div>
              )}
              {fileExplanation.keyParts && fileExplanation.keyParts.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Key Parts:</span>
                  <ul className="space-y-0.5 pl-1">
                    {fileExplanation.keyParts.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fileExplanation.concept && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px]">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p><strong className="text-amber-300">Concept:</strong> {fileExplanation.concept}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Monaco Diff Editor */}
      <div className="flex-1 w-full overflow-hidden">
        <DiffEditor
          height="100%"
          width="100%"
          theme="vs-dark"
          language={language}
          original={currentItem.original}
          modified={currentItem.proposed}
          keepCurrentOriginalModel={true}
          keepCurrentModifiedModel={true}
          onMount={handleEditorMount}
          options={{
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
            fontSize: 14,
            lineHeight: 22,
            renderSideBySide: sideBySide,
            originalEditable: false,
            readOnly: false,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
