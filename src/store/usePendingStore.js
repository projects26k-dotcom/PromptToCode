import { create } from 'zustand';
import { useProjectStore } from './useProjectStore';
import { useProjectsStore } from './useProjectsStore';
import { useSnapshotStore } from './useSnapshotStore';
import { useChatStore } from './useChatStore';
import { createSnapshot } from '../lib/snapshots';

let undoTimer = null;

export const usePendingStore = create((set, get) => ({
  pending: {}, // { [path]: { original: string, proposed: string, isNew: boolean, messageId: string, jsonError?: string } }
  reviewingFile: null,
  fileHistory: {}, // { [messageId + ':' + path]: 'accepted' | 'rejected' }
  undoState: null, // { type: 'acceptAll' | 'rejectAll', pendingSnapshot: {}, filesSnapshot: {}, message: string }

  // Set pending changes from parsed AI files
  setPending: (changes, messageId = '') => {
    const currentFiles = useProjectStore.getState().files;
    const currentPending = { ...get().pending };
    let firstChangedFile = null;

    for (const { path: rawPath, content } of changes) {
      if (!rawPath || typeof content !== 'string') continue;

      // Match path against currentFiles with/without leading slash
      let path = rawPath;
      if (!(path in currentFiles)) {
        if (path.startsWith('/') && path.slice(1) in currentFiles) {
          path = path.slice(1);
        } else if (!path.startsWith('/') && `/${path}` in currentFiles) {
          path = `/${path}`;
        }
      }

      const existingContent = currentFiles[path];
      const isNew = !(path in currentFiles);

      // Skip identical content
      if (!isNew && existingContent === content) {
        continue;
      }

      currentPending[path] = {
        original: isNew ? '' : (existingContent ?? ''),
        proposed: content,
        isNew,
        messageId,
        jsonError: null,
      };

      if (!firstChangedFile) {
        firstChangedFile = path;
      }
    }

    set({
      pending: currentPending,
      reviewingFile: get().reviewingFile || firstChangedFile,
    });
  },

  // Accept a single file change with JSON validation
  acceptFile: async (path) => {
    const item = get().pending[path];
    if (!item) return false;

    // Validate JSON files before accepting
    if (path.endsWith('.json')) {
      try {
        JSON.parse(item.proposed);
      } catch (err) {
        set((state) => ({
          pending: {
            ...state.pending,
            [path]: {
              ...item,
              jsonError: err.message,
            },
          },
          reviewingFile: path,
        }));
        return false;
      }
    }

    const projectStore = useProjectStore.getState();
    const projectId = useProjectsStore.getState().currentProjectId;

    // 1. "before-ai" snapshot (captured once per AI response before changes)
    if (item.messageId && projectId) {
      const snapStore = useSnapshotStore.getState();
      if (!snapStore.createdBeforeAiMessageIds.has(item.messageId)) {
        const msgs = useChatStore.getState().messages;
        const asstIdx = msgs.findIndex((m) => m.id === item.messageId);
        const userMsg = asstIdx > 0 ? msgs[asstIdx - 1] : null;
        const rawPrompt = userMsg?.displayContent || userMsg?.content || msgs[asstIdx]?.userPrompt || 'AI Request';
        const cleanPrompt = rawPrompt.replace(/[\r\n]+/g, ' ').replace(/^Fix:\s*/i, '').slice(0, 60);

        await createSnapshot({
          projectId,
          files: projectStore.files,
          label: cleanPrompt,
          source: 'before-ai',
          messageId: item.messageId,
        });
        snapStore.markBeforeAiCreated(item.messageId);
      }
    }

    if (item.isNew) {
      projectStore.createFile(path);
    }
    projectStore.updateFileContent(path, item.proposed);
    projectStore.openFile(path);

    const newPending = { ...get().pending };
    delete newPending[path];

    const pendingKeys = Object.keys(newPending);
    let nextReview = get().reviewingFile;
    if (get().reviewingFile === path) {
      nextReview = pendingKeys.length > 0 ? pendingKeys[0] : null;
    }

    const historyKey = item.messageId ? `${item.messageId}:${path}` : path;

    set((state) => ({
      pending: newPending,
      reviewingFile: nextReview,
      fileHistory: {
        ...state.fileHistory,
        [historyKey]: 'accepted',
      },
    }));

    // 2. "after-ai" or "fix" snapshot after changes are accepted
    if (projectId) {
      const msgs = useChatStore.getState().messages;
      const asstIdx = item.messageId ? msgs.findIndex((m) => m.id === item.messageId) : -1;
      const userMsg = asstIdx > 0 ? msgs[asstIdx - 1] : null;
      const isFix = userMsg?.isAutoFix || userMsg?.displayContent?.startsWith('Fix:') || userMsg?.content?.includes('Fix:');
      const rawPrompt = userMsg?.displayContent || userMsg?.content || (asstIdx >= 0 ? msgs[asstIdx]?.userPrompt : '') || 'Accepted changes';
      const cleanPrompt = rawPrompt.replace(/[\r\n]+/g, ' ').replace(/^Fix:\s*/i, '').slice(0, 60);

      const label = isFix ? `Auto-fix: ${cleanPrompt}` : `AI: ${cleanPrompt}`;
      const source = isFix ? 'fix' : 'after-ai';

      await createSnapshot({
        projectId,
        files: useProjectStore.getState().files,
        label,
        source,
        messageId: item.messageId || null,
      });

      useSnapshotStore.getState().loadSnapshots(projectId);
    }

    return true;
  },

  // Reject a single file change
  rejectFile: (path) => {
    const item = get().pending[path];
    if (!item) return;

    const newPending = { ...get().pending };
    delete newPending[path];

    const pendingKeys = Object.keys(newPending);
    let nextReview = get().reviewingFile;
    if (get().reviewingFile === path) {
      nextReview = pendingKeys.length > 0 ? pendingKeys[0] : null;
    }

    const historyKey = item.messageId ? `${item.messageId}:${path}` : path;

    set((state) => ({
      pending: newPending,
      reviewingFile: nextReview,
      fileHistory: {
        ...state.fileHistory,
        [historyKey]: 'rejected',
      },
    }));
  },

  // Accept all pending changes (validating JSON files)
  acceptAll: async () => {
    const { pending } = get();
    const pendingEntries = Object.entries(pending);
    if (pendingEntries.length === 0) return;

    const projectStore = useProjectStore.getState();
    const previousFilesSnapshot = { ...projectStore.files };
    const previousPendingSnapshot = { ...pending };
    const newHistory = { ...get().fileHistory };
    const remainingPending = { ...pending };
    let acceptedCount = 0;

    const projectId = useProjectsStore.getState().currentProjectId;

    // 1. Capture before-ai snapshot once before applying batch
    const firstMsgId = pendingEntries[0]?.[1]?.messageId;
    if (firstMsgId && projectId) {
      const snapStore = useSnapshotStore.getState();
      if (!snapStore.createdBeforeAiMessageIds.has(firstMsgId)) {
        const msgs = useChatStore.getState().messages;
        const asstIdx = msgs.findIndex((m) => m.id === firstMsgId);
        const userMsg = asstIdx > 0 ? msgs[asstIdx - 1] : null;
        const rawPrompt = userMsg?.displayContent || userMsg?.content || msgs[asstIdx]?.userPrompt || 'AI Batch Request';
        const cleanPrompt = rawPrompt.replace(/[\r\n]+/g, ' ').replace(/^Fix:\s*/i, '').slice(0, 60);

        await createSnapshot({
          projectId,
          files: previousFilesSnapshot,
          label: cleanPrompt,
          source: 'before-ai',
          messageId: firstMsgId,
        });
        snapStore.markBeforeAiCreated(firstMsgId);
      }
    }

    for (const [path, item] of pendingEntries) {
      // Validate JSON
      if (path.endsWith('.json')) {
        try {
          JSON.parse(item.proposed);
        } catch (err) {
          remainingPending[path] = {
            ...item,
            jsonError: err.message,
          };
          continue; // Keep invalid JSON pending
        }
      }

      if (item.isNew) {
        projectStore.createFile(path);
      }
      projectStore.updateFileContent(path, item.proposed);
      projectStore.openFile(path);

      delete remainingPending[path];
      acceptedCount++;

      const historyKey = item.messageId ? `${item.messageId}:${path}` : path;
      newHistory[historyKey] = 'accepted';
    }

    if (acceptedCount === 0) {
      set({ pending: remainingPending });
      return;
    }

    // 2. Capture after-ai / fix snapshot after batch applied
    if (projectId) {
      const msgs = useChatStore.getState().messages;
      const asstIdx = firstMsgId ? msgs.findIndex((m) => m.id === firstMsgId) : -1;
      const userMsg = asstIdx > 0 ? msgs[asstIdx - 1] : null;
      const isFix = userMsg?.isAutoFix || userMsg?.displayContent?.startsWith('Fix:') || userMsg?.content?.includes('Fix:');
      const rawPrompt = userMsg?.displayContent || userMsg?.content || (asstIdx >= 0 ? msgs[asstIdx]?.userPrompt : '') || 'Accepted changes';
      const cleanPrompt = rawPrompt.replace(/[\r\n]+/g, ' ').replace(/^Fix:\s*/i, '').slice(0, 60);

      const label = isFix ? `Auto-fix: ${cleanPrompt}` : `AI: ${cleanPrompt}`;
      const source = isFix ? 'fix' : 'after-ai';

      await createSnapshot({
        projectId,
        files: useProjectStore.getState().files,
        label,
        source,
        messageId: firstMsgId || null,
      });

      useSnapshotStore.getState().loadSnapshots(projectId);
    }

    // Set 8-second undo toast
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      set({ undoState: null });
    }, 8000);

    const remKeys = Object.keys(remainingPending);

    set({
      pending: remainingPending,
      reviewingFile: remKeys.length > 0 ? remKeys[0] : null,
      fileHistory: newHistory,
      undoState: {
        type: 'acceptAll',
        pendingSnapshot: previousPendingSnapshot,
        filesSnapshot: previousFilesSnapshot,
        message: `Accepted ${acceptedCount} file change${acceptedCount > 1 ? 's' : ''}`,
      },
    });
  },

  // Reject all pending changes
  rejectAll: () => {
    const { pending } = get();
    const pendingEntries = Object.entries(pending);
    if (pendingEntries.length === 0) return;

    const previousPendingSnapshot = { ...pending };
    const newHistory = { ...get().fileHistory };

    for (const [path, item] of pendingEntries) {
      const historyKey = item.messageId ? `${item.messageId}:${path}` : path;
      newHistory[historyKey] = 'rejected';
    }

    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      set({ undoState: null });
    }, 8000);

    set({
      pending: {},
      reviewingFile: null,
      fileHistory: newHistory,
      undoState: {
        type: 'rejectAll',
        pendingSnapshot: previousPendingSnapshot,
        filesSnapshot: { ...useProjectStore.getState().files },
        message: `Discarded ${pendingEntries.length} file change${pendingEntries.length > 1 ? 's' : ''}`,
      },
    });
  },

  // Undo the last Accept All / Reject All
  undoAction: () => {
    const { undoState } = get();
    if (!undoState) return;

    if (undoTimer) clearTimeout(undoTimer);

    if (undoState.type === 'acceptAll' && undoState.filesSnapshot) {
      const projectStore = useProjectStore.getState();
      const currentFiles = projectStore.files;
      for (const path of Object.keys(currentFiles)) {
        if (!(path in undoState.filesSnapshot)) {
          projectStore.deleteFile(path);
        }
      }
      for (const [path, content] of Object.entries(undoState.filesSnapshot)) {
        projectStore.updateFileContent(path, content);
      }
    }

    const firstPending = Object.keys(undoState.pendingSnapshot)[0] || null;

    set({
      pending: undoState.pendingSnapshot,
      reviewingFile: firstPending,
      undoState: null,
    });
  },

  clearUndo: () => {
    if (undoTimer) clearTimeout(undoTimer);
    set({ undoState: null });
  },

  // User edits the proposed side in Monaco diff view
  updateProposed: (path, content) => {
    const current = get().pending[path];
    if (!current) return;
    set((state) => ({
      pending: {
        ...state.pending,
        [path]: {
          ...current,
          proposed: content,
          jsonError: null, // Clear error on edit
        },
      },
    }));
  },

  reviewFile: (path) => {
    set({ reviewingFile: path });
  },

  closeReview: () => {
    set({ reviewingFile: null });
  },

  clearPendingForFile: (path) => {
    const { pending, reviewingFile } = get();
    if (!(path in pending)) return;

    const newPending = { ...pending };
    delete newPending[path];

    set({
      pending: newPending,
      reviewingFile: reviewingFile === path ? null : reviewingFile,
    });
  },
}));
