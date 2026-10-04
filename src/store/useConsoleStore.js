import { create } from 'zustand';
import { useProjectStore } from './useProjectStore';
import { useSettingsStore } from './useSettingsStore';

function computeFilesHash(files = {}) {
  const keys = Object.keys(files).sort();
  let str = '';
  for (const k of keys) {
    str += `${k}:${(files[k] || '').length}|`;
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

export const useConsoleStore = create((set, get) => ({
  logs: [],
  latestError: null,
  fixAttempts: {}, // { [signature]: number }
  acceptedSignatures: {}, // { [signature]: boolean }

  addLog: ({ level = 'log', kind = 'runtime', message = '', file = '', line, column, stack = '' }) => {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const cleanMsg = typeof message === 'string' ? message.trim() : String(message);
    const filesState = useProjectStore.getState().files || {};

    // For errors with no known file, hash project files so any manual edits reset the signature
    const signature = file
      ? `${cleanMsg}:${file}:${line || ''}`
      : `${cleanMsg}:hash-${computeFilesHash(filesState)}`;

    const isError = level === 'error';
    const errorKind = isError ? (kind || (file ? 'runtime' : 'runner')) : undefined;

    // Check if this error repeated after an accepted fix
    if (isError && get().acceptedSignatures[signature]) {
      const currentAttempts = get().fixAttempts[signature] || 0;
      const nextAttempts = currentAttempts + 1;
      set((state) => ({
        fixAttempts: {
          ...state.fixAttempts,
          [signature]: nextAttempts,
        },
      }));

      // If 2 attempts failed, turn off autoFix automatically
      if (nextAttempts >= 2) {
        const { autoFix, setAutoFix } = useSettingsStore.getState();
        if (autoFix) {
          setAutoFix(false);
          if (import.meta.env?.DEV) {
            console.warn('[VibeForge] Turned off auto-fix after 2 failed attempts on signature:', signature);
          }
        }
      }
    }

    const newEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      level,
      kind: errorKind,
      message: cleanMsg,
      file: file || '',
      line,
      column,
      stack: stack || '',
      signature,
      timestamp,
    };

    set((state) => {
      const nextLogs = [...state.logs.slice(-199), newEntry];
      return {
        logs: nextLogs,
        latestError: isError ? newEntry : state.latestError,
      };
    });
  },

  clearLogs: () => set({ logs: [], latestError: null }),

  dismissError: () => set({ latestError: null }),

  // Returns array of unique recent errors (by signature)
  getRecentErrors: (limit = 3) => {
    const errors = get().logs.filter((l) => l.level === 'error');
    const seen = new Set();
    const unique = [];

    for (let i = errors.length - 1; i >= 0; i--) {
      const err = errors[i];
      if (!seen.has(err.signature)) {
        seen.add(err.signature);
        unique.push(err);
        if (unique.length >= limit) break;
      }
    }

    return unique;
  },

  // Track that a fix for this signature was accepted by user
  recordFixAccepted: (signature) => {
    if (!signature) return;
    set((state) => ({
      acceptedSignatures: {
        ...state.acceptedSignatures,
        [signature]: true,
      },
    }));
  },

  // Increment fix attempts for a signature
  incrementFixAttempt: (signature) => {
    if (!signature) return;
    set((state) => ({
      fixAttempts: {
        ...state.fixAttempts,
        [signature]: (state.fixAttempts[signature] || 0) + 1,
      },
    }));
  },

  getFixAttempts: (signature) => {
    if (!signature) return 0;
    return get().fixAttempts[signature] || 0;
  },

  resetFixAttempts: () => set({ fixAttempts: {}, acceptedSignatures: {}, latestError: null }),
}));
