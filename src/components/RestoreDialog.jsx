import React, { useMemo } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  X,
  Plus,
  Minus,
  FileEdit,
  Check
} from 'lucide-react';
import { useSnapshotStore } from '../store/useSnapshotStore';
import { useProjectStore } from '../store/useProjectStore';
import { usePendingStore } from '../store/usePendingStore';
import { diffSnapshots } from '../lib/snapshots';

export default function RestoreDialog() {
  const { restoringSnapshot, closeRestoreDialog, restoreSnapshot } =
    useSnapshotStore();
  const currentFiles = useProjectStore((state) => state.files);
  const pending = usePendingStore((state) => state.pending);

  const pendingCount = Object.keys(pending).length;

  const diff = useMemo(() => {
    if (!restoringSnapshot) return null;
    return diffSnapshots(currentFiles, restoringSnapshot.files);
  }, [restoringSnapshot, currentFiles]);

  if (!restoringSnapshot) return null;

  const handleConfirmRestore = async () => {
    await restoreSnapshot(restoringSnapshot);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/60 shadow-xs">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Restore Snapshot</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                {restoringSnapshot.label}
              </p>
            </div>
          </div>
          <button
            onClick={closeRestoreDialog}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Restoring will replace all current files with this snapshot. A backup snapshot will be saved automatically so you can undo.
          </p>

          {/* Pending Changes Warning */}
          {pendingCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Pending AI changes will be discarded</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  You have {pendingCount} unreviewed file change{pendingCount > 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          )}

          {/* Changes Summary Breakdown */}
          {diff && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-2 max-h-48 overflow-y-auto">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Impact on current project:
              </span>

              {!diff.hasChanges ? (
                <p className="text-[11px] text-slate-400 italic">
                  This snapshot has identical files to your current project.
                </p>
              ) : (
                <div className="space-y-1.5 font-mono text-[11px]">
                  {diff.added.map((path) => (
                    <div key={path} className="flex items-center gap-1.5 text-emerald-400">
                      <Plus className="w-3 h-3" />
                      <span>Will create: {path}</span>
                    </div>
                  ))}

                  {diff.modified.map((path) => (
                    <div key={path} className="flex items-center gap-1.5 text-amber-400">
                      <FileEdit className="w-3 h-3" />
                      <span>Will revert: {path}</span>
                    </div>
                  ))}

                  {diff.removed.map((path) => (
                    <div key={path} className="flex items-center gap-1.5 text-rose-400">
                      <Minus className="w-3 h-3" />
                      <span>Will delete: {path}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={closeRestoreDialog}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmRestore}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-900/30 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>
        </div>
      </div>
    </div>
  );
}
