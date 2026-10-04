import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Wrench,
  Bookmark,
  RotateCcw,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileCode,
  Plus,
  Minus,
  FileEdit,
  ExternalLink
} from 'lucide-react';
import { diffSnapshots } from '../lib/snapshots';
import { useProjectStore } from '../store/useProjectStore';
import { DiffEditor } from '@monaco-editor/react';

function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getSourceMeta(source) {
  switch (source) {
    case 'initial':
      return {
        icon: <Layers className="w-3.5 h-3.5 text-sky-400" />,
        badge: 'Initial',
        badgeClass: 'bg-sky-950 text-sky-300 border-sky-800/60',
      };
    case 'before-ai':
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
        badge: 'Before AI',
        badgeClass: 'bg-purple-950 text-purple-300 border-purple-800/60',
      };
    case 'after-ai':
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        badge: 'AI',
        badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800/60',
      };
    case 'fix':
      return {
        icon: <Wrench className="w-3.5 h-3.5 text-amber-400" />,
        badge: 'Auto-fix',
        badgeClass: 'bg-amber-950 text-amber-300 border-amber-800/60',
      };
    case 'restore':
      return {
        icon: <RotateCcw className="w-3.5 h-3.5 text-rose-400" />,
        badge: 'Restore',
        badgeClass: 'bg-rose-950 text-rose-300 border-rose-800/60',
      };
    case 'manual':
    default:
      return {
        icon: <Bookmark className="w-3.5 h-3.5 text-indigo-400" />,
        badge: 'Checkpoint',
        badgeClass: 'bg-indigo-950 text-indigo-300 border-indigo-800/60',
      };
  }
}

export default function SnapshotItem({
  snapshot,
  prevSnapshot,
  isExpanded,
  onToggleExpand,
  onRestore,
  onPreview,
  onDelete,
}) {
  const currentFiles = useProjectStore((state) => state.files);
  const [selectedDiffFile, setSelectedDiffFile] = useState(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const { icon, badge, badgeClass } = getSourceMeta(snapshot.source);
  const timeStr = formatRelativeTime(snapshot.createdAt);
  const fullTime = new Date(snapshot.createdAt).toLocaleString();

  // Diff vs previous snapshot in timeline
  const prevDiff = useMemo(() => {
    if (!prevSnapshot) return null;
    return diffSnapshots(prevSnapshot.files, snapshot.files);
  }, [prevSnapshot, snapshot]);

  // Diff vs current active project files
  const currentDiff = useMemo(() => {
    if (!isExpanded) return null;
    return diffSnapshots(snapshot.files, currentFiles);
  }, [isExpanded, snapshot.files, currentFiles]);

  const changeSummary = useMemo(() => {
    if (snapshot.source === 'initial' && !prevSnapshot) {
      return `${snapshot.fileCount || Object.keys(snapshot.files || {}).length} files`;
    }
    if (!prevDiff || !prevDiff.hasChanges) {
      return 'No changes';
    }
    const parts = [];
    if (prevDiff.added.length > 0) parts.push(`+${prevDiff.added.length} added`);
    if (prevDiff.removed.length > 0) parts.push(`-${prevDiff.removed.length} removed`);
    if (prevDiff.modified.length > 0) parts.push(`${prevDiff.modified.length} modified`);
    return parts.join(', ');
  }, [snapshot, prevSnapshot, prevDiff]);

  const allDiffFiles = useMemo(() => {
    if (!currentDiff) return [];
    const list = [
      ...currentDiff.added.map((path) => ({ path, type: 'added' })),
      ...currentDiff.modified.map((path) => ({ path, type: 'modified' })),
      ...currentDiff.removed.map((path) => ({ path, type: 'removed' })),
    ];
    return list;
  }, [currentDiff]);

  const activeDiffFilePath = selectedDiffFile || allDiffFiles[0]?.path || null;

  return (
    <div className="relative pl-6 pb-6 last:pb-0 group">
      {/* Vertical Timeline Track Line */}
      <div className="absolute left-2.5 top-3 bottom-0 w-0.5 bg-slate-800 group-last:hidden" />

      {/* Source Icon Node */}
      <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xs">
        {icon}
      </div>

      {/* Snapshot Card */}
      <div className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 transition-all shadow-xs">
        {/* Top Meta Header */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badgeClass}`}
            >
              {badge}
            </span>
            <h4
              className="text-xs font-semibold text-slate-200 truncate max-w-[190px]"
              title={snapshot.label}
            >
              {snapshot.label}
            </h4>
          </div>

          <span
            className="text-[10px] text-slate-400 font-mono shrink-0 cursor-help"
            title={fullTime}
          >
            {timeStr}
          </span>
        </div>

        {/* Change Stats */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5 font-mono">
          <span>{changeSummary}</span>
          <span className="text-slate-500">
            {snapshot.fileCount || Object.keys(snapshot.files || {}).length} files
          </span>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onRestore(snapshot)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium text-[11px] transition-all shadow-xs cursor-pointer"
              title="Restore this version into active project"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore</span>
            </button>

            <button
              onClick={() => onPreview(snapshot)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Preview without restoring"
            >
              <Eye className="w-3 h-3 text-sky-400" />
              <span>Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {snapshot.source !== 'initial' && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1 animate-in fade-in">
                  <button
                    onClick={() => {
                      onDelete(snapshot.id);
                      setIsConfirmingDelete(false);
                    }}
                    className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Delete snapshot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )
            )}

            <button
              onClick={onToggleExpand}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse changes' : 'Inspect files and diff'}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded File Inspection & Monaco Diff View */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in duration-200">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-1.5 block">
              Changes vs Current Project:
            </span>

            {allDiffFiles.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-1">
                Files are identical to the current active project.
              </p>
            ) : (
              <div className="space-y-2">
                {/* File chips */}
                <div className="flex flex-wrap gap-1">
                  {allDiffFiles.map(({ path, type }) => (
                    <button
                      key={path}
                      onClick={() => setSelectedDiffFile(path)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                        activeDiffFilePath === path
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {type === 'added' && <Plus className="w-2.5 h-2.5 text-emerald-400" />}
                      {type === 'removed' && <Minus className="w-2.5 h-2.5 text-rose-400" />}
                      {type === 'modified' && <FileEdit className="w-2.5 h-2.5 text-amber-400" />}
                      <span>{path}</span>
                    </button>
                  ))}
                </div>

                {/* Monaco Diff View for selected file */}
                {activeDiffFilePath && (
                  <div className="h-44 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative mt-2">
                    <div className="px-2 py-1 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between items-center">
                      <span>Diff: {activeDiffFilePath} (Snapshot vs Current)</span>
                    </div>
                    <DiffEditor
                      original={snapshot.files[activeDiffFilePath] || ''}
                      modified={currentFiles[activeDiffFilePath] || ''}
                      language={
                        activeDiffFilePath.endsWith('.jsx') || activeDiffFilePath.endsWith('.js')
                          ? 'javascript'
                          : activeDiffFilePath.endsWith('.css')
                          ? 'css'
                          : activeDiffFilePath.endsWith('.html')
                          ? 'html'
                          : 'plaintext'
                      }
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 11,
                        lineNumbers: 'on',
                        renderSideBySide: false, // Inline diff for compact drawer
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
