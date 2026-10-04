import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  BookmarkPlus,
  Plus,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useSnapshotStore } from '../store/useSnapshotStore';
import { isIdbAvailable } from '../lib/db';
import SnapshotItem from './SnapshotItem';

export default function TimelinePanel() {
  const {
    snapshots,
    isTimelineOpen,
    closeTimeline,
    selectedSnapshotId,
    setSelectedSnapshot,
    openRestoreDialog,
    startPreview,
    deleteSnapshot,
    createManualCheckpoint,
  } = useSnapshotStore();

  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');

  // Handle Escape key to close timeline
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isTimelineOpen) {
        closeTimeline();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTimelineOpen, closeTimeline]);

  if (!isTimelineOpen) return null;

  const handleSaveCheckpoint = async (e) => {
    e.preventDefault();
    await createManualCheckpoint(checkpointName);
    setCheckpointName('');
    setIsCreatingCheckpoint(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={closeTimeline} />

      {/* Drawer Content */}
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 text-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-100">Version History</h3>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-indigo-300 border border-slate-700">
                  {snapshots.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Browse snapshots, diffs & restore</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCreatingCheckpoint(!isCreatingCheckpoint)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Save a named checkpoint"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Checkpoint</span>
            </button>

            <button
              onClick={closeTimeline}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close history (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* IndexedDB Unavailable Warning */}
        {!isIdbAvailable && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>IndexedDB is unavailable. History is saved in memory for this session.</span>
          </div>
        )}

        {/* Inline Save Checkpoint Form */}
        {isCreatingCheckpoint && (
          <form
            onSubmit={handleSaveCheckpoint}
            className="p-3 mx-4 mt-3 rounded-xl bg-slate-900 border border-indigo-500/40 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Save Checkpoint
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={checkpointName}
                onChange={(e) => setCheckpointName(e.target.value)}
                placeholder="Checkpoint label (optional)..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none font-sans"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingCheckpoint(false)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Timeline Scroll List */}
        <div className="flex-1 overflow-y-auto p-4">
          {snapshots.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-300 mb-1">No history yet</p>
              <p className="text-[11px] text-slate-500 max-w-[220px]">
                Your project snapshots and AI iterations will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {snapshots.map((snap, idx) => (
                <SnapshotItem
                  key={snap.id}
                  snapshot={snap}
                  prevSnapshot={snapshots[idx + 1] || null}
                  isExpanded={selectedSnapshotId === snap.id}
                  onToggleExpand={() => setSelectedSnapshot(snap.id)}
                  onRestore={openRestoreDialog}
                  onPreview={startPreview}
                  onDelete={deleteSnapshot}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
