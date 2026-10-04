import React from 'react';
import {
  Sparkles,
  CheckCheck,
  XCircle,
  Eye,
  RotateCcw,
  GitPullRequest
} from 'lucide-react';
import { usePendingStore } from '../store/usePendingStore';

export default function PendingChangesBar() {
  const { pending, reviewingFile, undoState, acceptAll, rejectAll, reviewFile, undoAction, clearUndo } =
    usePendingStore();

  const pendingList = Object.keys(pending);
  const count = pendingList.length;

  if (count === 0 && !undoState) {
    return null;
  }

  return (
    <>
      {/* Pending Banner */}
      {count > 0 && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-purple-950/90 border-b border-indigo-500/30 text-xs select-none shadow-xs shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-xs">
              <GitPullRequest className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-100">
                {count} {count === 1 ? 'file' : 'files'} proposed by AI
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline ml-2">
                Review diffs before applying to project
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!reviewingFile && (
              <button
                onClick={() => reviewFile(pendingList[0])}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-all cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Review Diff</span>
              </button>
            )}

            <button
              onClick={rejectAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 border border-slate-700/60 hover:border-rose-800/60 text-slate-300 hover:text-rose-200 text-xs font-medium transition-all cursor-pointer shadow-xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject All</span>
            </button>

            <button
              onClick={acceptAll}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <CheckCheck className="w-3.5 h-3.5 text-indigo-100" />
              <span>Accept All</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Undo Toast (8 seconds) */}
      {undoState && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-indigo-500/40 text-xs text-slate-200 shadow-2xl backdrop-blur-md animate-slideUp">
          <span>{undoState.message}</span>
          <button
            onClick={undoAction}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo (8s)</span>
          </button>
          <button
            onClick={clearUndo}
            className="text-slate-400 hover:text-white text-xs p-1"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
