import { create } from 'zustand';
import {
  listSnapshots,
  createSnapshot as libCreateSnapshot,
  deleteSnapshot as libDeleteSnapshot,
} from '../lib/snapshots';
import { useProjectStore } from './useProjectStore';
import { useProjectsStore } from './useProjectsStore';
import { useChatStore } from './useChatStore';
import { usePendingStore } from './usePendingStore';

let manualDebounceTimer = null;
let undoTimer = null;

export const useSnapshotStore = create((set, get) => ({
  snapshots: [],
  isTimelineOpen: false,
  previewingSnapshot: null, // snapshot object | null
  restoringSnapshot: null, // snapshot object | null
  selectedSnapshotId: null, // string | null (expanded in timeline)
  activeDiffFile: null, // string | null
  undoRestoreState: null, // { restoreSnapshot: object, restoredSnapshotLabel: string } | null
  createdBeforeAiMessageIds: new Set(), // Track messageIds with before-ai snapshots

  // Load all snapshots for the active project
  loadSnapshots: async (projectId) => {
    if (!projectId) {
      set({ snapshots: [] });
      return;
    }
    const items = await listSnapshots(projectId);
    set({ snapshots: items });
  },

  // Toggle/Open/Close Timeline drawer
  openTimeline: () => set({ isTimelineOpen: true }),
  closeTimeline: () =>
    set({
      isTimelineOpen: false,
      selectedSnapshotId: null,
      activeDiffFile: null,
    }),
  toggleTimeline: () =>
    set((state) => ({
      isTimelineOpen: !state.isTimelineOpen,
      selectedSnapshotId: state.isTimelineOpen ? null : state.selectedSnapshotId,
      activeDiffFile: state.isTimelineOpen ? null : state.activeDiffFile,
    })),

  // Snapshot Preview mode (view files without applying changes)
  startPreview: (snapshot) => {
    set({ previewingSnapshot: snapshot });
  },
  exitPreview: () => {
    set({ previewingSnapshot: null });
  },

  // Restore dialog controls
  openRestoreDialog: (snapshot) => {
    set({ restoringSnapshot: snapshot });
  },
  closeRestoreDialog: () => {
    set({ restoringSnapshot: null });
  },

  // Timeline item expansion and diff file selection
  setSelectedSnapshot: (id) => {
    set((state) => ({
      selectedSnapshotId: state.selectedSnapshotId === id ? null : id,
      activeDiffFile: null,
    }));
  },
  setActiveDiffFile: (filePath) => set({ activeDiffFile: filePath }),

  // Manual Checkpoint creation
  createManualCheckpoint: async (labelName) => {
    const projectId = useProjectsStore.getState().currentProjectId;
    const files = useProjectStore.getState().files;
    if (!projectId || !files) return null;

    const label = labelName?.trim() || 'Manual Checkpoint';
    const snapshot = await libCreateSnapshot({
      projectId,
      files,
      label,
      source: 'manual',
      force: true, // User explicitly clicked Save Checkpoint
    });

    await get().loadSnapshots(projectId);
    return snapshot;
  },

  // Debounced manual edit snapshot (~60s after user typing)
  scheduleManualEditSnapshot: (projectId, files) => {
    if (manualDebounceTimer) clearTimeout(manualDebounceTimer);

    manualDebounceTimer = setTimeout(async () => {
      if (!projectId || !files) return;
      const snap = await libCreateSnapshot({
        projectId,
        files,
        label: 'Manual edits',
        source: 'manual',
        force: false,
      });
      if (snap) {
        get().loadSnapshots(projectId);
      }
    }, 60000);
  },

  // Restore snapshot with automatic "Before restore" undo snapshot
  restoreSnapshot: async (snapshot) => {
    if (!snapshot || !snapshot.files) return;

    // 1. Stop any in-progress AI stream
    useChatStore.getState().stopStreaming();

    const projectId = useProjectsStore.getState().currentProjectId;
    const projectStore = useProjectStore.getState();
    const currentFiles = projectStore.files;

    // 2. Create "Before restore" snapshot of current files so it can be reversed
    const beforeRestore = await libCreateSnapshot({
      projectId,
      files: currentFiles,
      label: 'Before restore',
      source: 'restore',
      force: true,
    });

    // 3. Clean and sanitize tabs for restored file structure
    const restoredFiles = snapshot.files;
    const restoredFileKeys = Object.keys(restoredFiles);

    const validTabs = (projectStore.openTabs || []).filter(
      (tab) => tab in restoredFiles
    );

    const fallbackActive =
      restoredFiles['/App.jsx'] ? '/App.jsx' :
      restoredFiles['index.html'] ? 'index.html' :
      restoredFileKeys[0] || 'index.html';

    const newTabs = validTabs.length > 0 ? validTabs : [fallbackActive];
    const newActiveFile = restoredFiles[projectStore.activeFile]
      ? projectStore.activeFile
      : newTabs[0];

    // 4. Apply restored files to project store
    projectStore.loadProjectData({
      files: { ...restoredFiles },
      openTabs: newTabs,
      activeFile: newActiveFile,
    });

    // 5. Clear pending diff reviews
    usePendingStore.setState({
      pending: {},
      reviewingFile: null,
      undoState: null,
    });

    // 6. Save project immediately
    useProjectsStore.getState().scheduleAutoSave();

    // 7. Refresh snapshots list
    await get().loadSnapshots(projectId);

    // 8. 10-second undo toast
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      set({ undoRestoreState: null });
    }, 10000);

    set({
      undoRestoreState: {
        restoreSnapshot: beforeRestore,
        restoredSnapshotLabel: snapshot.label,
      },
      restoringSnapshot: null,
      previewingSnapshot: null,
    });
  },

  // Undo the last restore
  undoRestore: async () => {
    const { undoRestoreState } = get();
    if (!undoRestoreState || !undoRestoreState.restoreSnapshot) return;

    if (undoTimer) clearTimeout(undoTimer);

    const target = undoRestoreState.restoreSnapshot;
    set({ undoRestoreState: null });

    await get().restoreSnapshot(target);
  },

  clearUndoRestore: () => {
    if (undoTimer) clearTimeout(undoTimer);
    set({ undoRestoreState: null });
  },

  // Delete a snapshot
  deleteSnapshot: async (id) => {
    const projectId = useProjectsStore.getState().currentProjectId;
    await libDeleteSnapshot(id);
    await get().loadSnapshots(projectId);
    if (get().selectedSnapshotId === id) {
      set({ selectedSnapshotId: null, activeDiffFile: null });
    }
  },

  // Record that a before-ai snapshot was captured for this AI message
  markBeforeAiCreated: (messageId) => {
    if (!messageId) return;
    set((state) => {
      const next = new Set(state.createdBeforeAiMessageIds);
      next.add(messageId);
      return { createdBeforeAiMessageIds: next };
    });
  },
}));
