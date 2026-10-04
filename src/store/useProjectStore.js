import { create } from 'zustand';
import { usePendingStore } from './usePendingStore';
import { useProjectsStore } from './useProjectsStore';
import { useSnapshotStore } from './useSnapshotStore';

const defaultFiles = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello VibeForge</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div class="container">
      <div class="card">
        <h1>✨ Hello, VibeForge!</h1>
        <p class="tagline">Describe it. Forge it. Run it.</p>
        <button id="action-btn">Click for Magic</button>
        <div id="output"></div>
      </div>
    </div>
    <script src="script.js"></script>
  </body>
</html>`,

  'style.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: #f8fafc;
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.container {
  padding: 2rem;
}

.card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 1.5rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-width: 480px;
}

h1 {
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #818cf8, #c084fc);
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 0.75rem;
}

.tagline {
  color: #94a3b8;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

button {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  border: none;
  padding: 0.75rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 9999px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.5);
}

#output {
  margin-top: 1.5rem;
  font-weight: 500;
  color: #38bdf8;
  min-height: 1.5rem;
}`,

  'script.js': `// Welcome to VibeForge!
const btn = document.getElementById('action-btn');
const output = document.getElementById('output');

const quotes = [
  '⚡ Code forged with pure vibes.',
  '🚀 Building the future one prompt at a time.',
  '✨ Describe it. Forge it. Run it.',
  '💡 From imagination to running code instantly.'
];

let index = 0;

btn?.addEventListener('click', () => {
  output.textContent = quotes[index % quotes.length];
  index++;
});`
};

export const useProjectStore = create((set, get) => ({
  files: defaultFiles,
  openTabs: ['index.html', 'style.css', 'script.js'],
  activeFile: 'index.html',

  // Load project snapshot from IndexedDB
  loadProjectData: ({ files, openTabs, activeFile }) => {
    set({
      files: files || {},
      openTabs: openTabs || [],
      activeFile: activeFile || null,
    });
  },

  // Open a file in tabs and make it active
  openFile: (path) => {
    const { files, openTabs } = get();
    if (!(path in files)) return;

    if (!openTabs.includes(path)) {
      set({
        openTabs: [...openTabs, path],
        activeFile: path,
      });
    } else {
      set({ activeFile: path });
    }

    try {
      useProjectsStore.getState().scheduleAutoSave();
    } catch {}
  },

  // Close a tab
  closeTab: (path) => {
    const { openTabs, activeFile } = get();
    const updatedTabs = openTabs.filter((t) => t !== path);
    let nextActiveFile = activeFile;

    if (activeFile === path) {
      if (updatedTabs.length > 0) {
        const closedIndex = openTabs.indexOf(path);
        const nextIndex = Math.max(0, closedIndex - 1);
        nextActiveFile = updatedTabs[nextIndex] || updatedTabs[0];
      } else {
        nextActiveFile = null;
      }
    }

    set({
      openTabs: updatedTabs,
      activeFile: nextActiveFile,
    });

    try {
      useProjectsStore.getState().scheduleAutoSave();
    } catch {}
  },

  // Update content of a file
  updateFileContent: (path, content) => {
    const nextFiles = {
      ...get().files,
      [path]: content,
    };

    set({ files: nextFiles });

    try {
      useProjectsStore.getState().scheduleAutoSave();
    } catch {}

    try {
      const projectId = useProjectsStore.getState().currentProjectId;
      if (projectId) {
        useSnapshotStore.getState().scheduleManualEditSnapshot(projectId, nextFiles);
      }
    } catch {}
  },

  // Create a new file
  createFile: (path) => {
    const cleanPath = path.trim();
    if (!cleanPath) return;

    const { files, openTabs } = get();
    if (cleanPath in files) {
      get().openFile(cleanPath);
      return;
    }

    set({
      files: {
        ...files,
        [cleanPath]: '',
      },
      openTabs: [...openTabs, cleanPath],
      activeFile: cleanPath,
    });

    try {
      useProjectsStore.getState().scheduleAutoSave();
    } catch {}
  },

  // Delete a file
  deleteFile: (path) => {
    try {
      usePendingStore.getState().clearPendingForFile(path);
    } catch {}

    const { files, openTabs, activeFile } = get();
    const newFiles = { ...files };
    delete newFiles[path];

    const updatedTabs = openTabs.filter((t) => t !== path);
    let nextActive = activeFile;

    if (activeFile === path) {
      nextActive = updatedTabs.length > 0 ? updatedTabs[0] : null;
    }

    set({
      files: newFiles,
      openTabs: updatedTabs,
      activeFile: nextActive,
    });

    try {
      useProjectsStore.getState().scheduleAutoSave();
    } catch {}
  },

  // Rename a file
  renameFile: (oldPath, newPath) => {
    const cleanNewPath = newPath.trim();
    if (!cleanNewPath || oldPath === cleanNewPath) return;

    try {
      usePendingStore.getState().clearPendingForFile(oldPath);
    } catch {}

    const { files, openTabs, activeFile } = get();
    if (cleanNewPath in files) {
      alert(`A file named "${cleanNewPath}" already exists.`);
      return;
    }

    const content = files[oldPath] ?? '';
    const newFiles = { ...files };
    delete newFiles[oldPath];
    newFiles[cleanNewPath] = content;

    const newTabs = openTabs.map((t) => (t === oldPath ? cleanNewPath : t));
    const nextActive = activeFile === oldPath ? cleanNewPath : activeFile;

    set({
      files: newFiles,
      openTabs: newTabs,
      activeFile: nextActive,
    });

    try {
      useProjectsStore.getState().scheduleAutoSave();
    } catch {}
  },
}));
