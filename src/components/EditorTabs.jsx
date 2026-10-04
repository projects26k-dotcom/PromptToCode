import React from 'react';
import { X, FileCode, FileJson, FileText, File, GitPullRequest } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { usePendingStore } from '../store/usePendingStore';

function getTabIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    case 'css':
      return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    case 'ts':
    case 'tsx':
      return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'md':
      return <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    default:
      return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
}

export default function EditorTabs() {
  const { openTabs, activeFile, openFile, closeTab } = useProjectStore();
  const { pending, reviewingFile, reviewFile, closeReview } = usePendingStore();

  const handleTabClick = (tab) => {
    // If we were reviewing a diff and clicked a regular tab, return to editor for that tab
    if (reviewingFile) {
      closeReview();
    }
    openFile(tab);
  };

  if (openTabs.length === 0 && !reviewingFile) {
    return null;
  }

  return (
    <div className="flex items-center bg-slate-950 border-b border-slate-800 overflow-x-auto select-none no-scrollbar h-9">
      {/* If currently reviewing a diff, show diff review tab indicator */}
      {reviewingFile && (
        <div className="flex items-center gap-2 px-3.5 h-full text-xs font-mono cursor-pointer border-r border-slate-800 bg-indigo-950/60 text-indigo-200 border-t-2 border-t-indigo-500 font-semibold shrink-0">
          <GitPullRequest className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Review: {reviewingFile}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeReview();
            }}
            className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Close Diff Review"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {openTabs.map((tab) => {
        const isActive = !reviewingFile && activeFile === tab;
        const isPending = !!pending[tab];

        return (
          <div
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`group flex items-center gap-2 px-3.5 h-full text-xs font-mono cursor-pointer border-r border-slate-800 transition-colors ${
              isActive
                ? 'bg-slate-900 text-slate-100 border-t-2 border-t-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border-t-2 border-t-transparent'
            }`}
          >
            {getTabIcon(tab)}
            <span className="truncate max-w-[140px]">{tab}</span>

            {/* Pending Dot indicator on tab */}
            {isPending && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  reviewFile(tab);
                }}
                className="w-2 h-2 rounded-full bg-amber-400 hover:scale-125 transition-transform"
                title="Has pending AI changes (click to review diff)"
              />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab);
              }}
              className={`p-0.5 rounded hover:bg-slate-700/60 transition-colors ${
                isActive
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 opacity-60 group-hover:opacity-100 hover:text-slate-300'
              }`}
              title="Close Tab"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
