import { create } from 'zustand';
import { listProjects, getProject, saveProject, deleteProject as dbDeleteProject, duplicateProject as dbDuplicateProject } from '../lib/db';
import { TEMPLATES } from '../lib/templates';
import { useProjectStore } from './useProjectStore';
import { useChatStore } from './useChatStore';
import { usePendingStore } from './usePendingStore';
import { useConsoleStore } from './useConsoleStore';
import { useSnapshotStore } from './useSnapshotStore';
import { createSnapshot, listSnapshots, deleteSnapshotsForProject } from '../lib/snapshots';

let autoSaveTimer = null;
const CURRENT_PROJ_KEY = 'prompttocode_current_project_id';

export const useProjectsStore = create((set, get) => ({
  projects: [],
  currentProjectId: null,
  currentProjectType: 'vanilla', // 'vanilla' | 'react'
  saveStatus: 'saved', // 'saved' | 'saving' | 'error'
  loadError: null, // { message: string, projectId: string | null }
  isNewProjectModalOpen: false,
  isMenuOpen: false,

  // Initialize projects on app start
  initProjects: async () => {
    try {
      let all = await listProjects();

      // First ever launch: create "My First Project"
      if (all.length === 0) {
        const defaultTpl = TEMPLATES[0];
        const initialProj = {
          id: 'proj-' + Date.now(),
          name: 'My First Project',
          projectType: 'vanilla',
          files: defaultTpl.files,
          openTabs: defaultTpl.openTabs,
          activeFile: defaultTpl.activeFile,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await saveProject(initialProj);
        all = await listProjects();
      }

      set({ projects: all, loadError: null });

      // Determine project to open
      useConsoleStore.getState().resetFixAttempts();
      useChatStore.setState({ isStreaming: false });

      const savedId = localStorage.getItem(CURRENT_PROJ_KEY);
      const targetProject = (savedId && all.find((p) => p.id === savedId)) ? savedId : all[0]?.id;

      if (targetProject) {
        await get().openProject(targetProject, false);
      }
    } catch (err) {
      console.error('Failed to initialize projects:', err);
      set({
        loadError: {
          message: err.message || 'Failed to initialize project database',
          projectId: null,
        },
      });
    }
  },

  // Save current project immediately
  saveCurrentProjectNow: async () => {
    const { currentProjectId, projects, currentProjectType } = get();
    if (!currentProjectId) return;

    try {
      set({ saveStatus: 'saving' });
      const currentMeta = projects.find((p) => p.id === currentProjectId);
      const name = currentMeta?.name || 'Untitled Project';

      const projectState = useProjectStore.getState();
      const chatState = useChatStore.getState();

      // Keep only lightweight thumbnails in persisted history (strip full base64)
      const persistedMessages = (chatState.messages || []).map((msg) => {
        if (msg.images && msg.images.length > 0) {
          return {
            ...msg,
            images: msg.images.map((img) => ({
              id: img.id,
              name: img.name,
              size: img.size,
              mimeType: img.mimeType,
              thumbnail: img.thumbnail,
              width: img.width,
              height: img.height,
            })),
          };
        }
        return msg;
      });

      const snapshot = {
        id: currentProjectId,
        name,
        projectType: currentProjectType || currentMeta?.projectType || 'vanilla',
        files: projectState.files,
        emptyFolders: projectState.emptyFolders || [],
        openTabs: projectState.openTabs,
        activeFile: projectState.activeFile,
        messages: persistedMessages,
        createdAt: currentMeta?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await saveProject(snapshot);
      const updatedList = await listProjects();

      set({
        projects: updatedList,
        saveStatus: 'saved',
      });
    } catch (err) {
      console.error('Failed to save project:', err);
      set({ saveStatus: 'error' });
    }
  },

  // Debounced auto-save (~800ms)
  scheduleAutoSave: () => {
    set({ saveStatus: 'saving' });
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      get().saveCurrentProjectNow();
    }, 800);
  },

  // Create a new project from template
  createProject: async (name, templateId = 'blank-vanilla') => {
    try {
      const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
      const cleanName = name?.trim() || 'Untitled Project';
      const newId = 'proj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

      const newProject = {
        id: newId,
        name: cleanName,
        projectType: template.type || 'vanilla',
        files: { ...template.files },
        emptyFolders: [],
        openTabs: [...template.openTabs],
        activeFile: template.activeFile,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveProject(newProject);
      useConsoleStore.getState().resetFixAttempts();
      useChatStore.setState({ isStreaming: false });

      // Create initial snapshot for new project
      try {
        await createSnapshot({
          projectId: newId,
          files: template.files,
          label: 'Initial template',
          source: 'initial',
        });
      } catch {}

      const updatedList = await listProjects();
      set({
        projects: updatedList,
        currentProjectType: template.type || 'vanilla',
        isNewProjectModalOpen: false,
        isMenuOpen: false,
      });

      await get().openProject(newId);
    } catch (err) {
      console.error('Failed to create project:', err);
      set({ saveStatus: 'error' });
    }
  },

  // Open an existing project with try/catch resilience
  openProject: async (id, saveCurrent = true) => {
    if (saveCurrent && get().currentProjectId) {
      useChatStore.getState().stopStreaming();
      await get().saveCurrentProjectNow();
    }

    try {
      const proj = await getProject(id);
      if (!proj) throw new Error(`Project "${id}" not found.`);

      const pType = proj.projectType || 'vanilla';

      usePendingStore.setState({ pending: {}, reviewingFile: null, undoState: null });
      useConsoleStore.getState().resetFixAttempts();
      useConsoleStore.getState().clearLogs();

      useProjectStore.getState().loadProjectData({
        files: proj.files || {},
        emptyFolders: proj.emptyFolders || [],
        openTabs: proj.openTabs || (pType === 'react' ? ['/App.jsx', '/styles.css'] : ['index.html']),
        activeFile: proj.activeFile || (pType === 'react' ? '/App.jsx' : 'index.html'),
      });

      useChatStore.getState().loadChatMessages(proj.messages || []);

      // Close timeline, exit preview, and load snapshots for target project
      try {
        const snapStore = useSnapshotStore.getState();
        snapStore.closeTimeline();
        snapStore.exitPreview();

        const existingSnaps = await listSnapshots(id);
        if (existingSnaps.length === 0 && proj.files && Object.keys(proj.files).length > 0) {
          await createSnapshot({
            projectId: id,
            files: proj.files,
            label: 'Initial project',
            source: 'initial',
          });
        }
        await snapStore.loadSnapshots(id);
      } catch {}

      localStorage.setItem(CURRENT_PROJ_KEY, id);
      set({
        currentProjectId: id,
        currentProjectType: pType,
        saveStatus: 'saved',
        loadError: null,
        isMenuOpen: false,
      });
    } catch (err) {
      console.error('Failed to open project:', err);
      set({
        loadError: {
          message: err.message || 'Corrupted project data',
          projectId: id,
        },
      });
    }
  },

  // Reset corrupted project to default starter template
  resetCorruptedProject: async () => {
    const { loadError, currentProjectId, projects } = get();
    const targetId = loadError?.projectId || currentProjectId || ('proj-' + Date.now());
    const targetMeta = projects.find((p) => p.id === targetId);
    const pType = targetMeta?.projectType || 'vanilla';
    const defaultTpl = TEMPLATES.find((t) => t.type === pType) || TEMPLATES[0];

    const repaired = {
      id: targetId,
      name: targetMeta?.name || 'Repaired Project',
      projectType: pType,
      files: { ...defaultTpl.files },
      openTabs: [...defaultTpl.openTabs],
      activeFile: defaultTpl.activeFile,
      messages: [],
      createdAt: targetMeta?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveProject(repaired);
      const all = await listProjects();
      set({ projects: all, loadError: null });
      await get().openProject(repaired.id, false);
    } catch (err) {
      console.error('Failed to reset project:', err);
    }
  },

  // Reset React core preview files (/package.json, /index.jsx, /App.jsx)
  resetReactProjectPreview: () => {
    const reactTpl = TEMPLATES.find((t) => t.id === 'blank-react') || TEMPLATES[3];
    const projectStore = useProjectStore.getState();

    projectStore.updateFileContent('/package.json', reactTpl.files['/package.json']);
    projectStore.updateFileContent('/index.jsx', reactTpl.files['/index.jsx']);
    if (!projectStore.files['/App.jsx']) {
      projectStore.updateFileContent('/App.jsx', reactTpl.files['/App.jsx']);
    }

    get().scheduleAutoSave();
    set({ isMenuOpen: false });
  },

  // Rename a project
  renameProject: async (id, newName) => {
    const cleanName = newName?.trim();
    if (!cleanName) return;

    try {
      const proj = await getProject(id);
      if (proj) {
        proj.name = cleanName;
        await saveProject(proj);
        const updatedList = await listProjects();
        set({ projects: updatedList });
      }
    } catch (err) {
      console.error('Failed to rename project:', err);
    }
  },

  // Delete a project
  deleteProject: async (id) => {
    try {
      await dbDeleteProject(id);
      try {
        await deleteSnapshotsForProject(id);
      } catch {}

      const updatedList = await listProjects();
      set({ projects: updatedList });

      if (get().currentProjectId === id) {
        if (updatedList.length > 0) {
          await get().openProject(updatedList[0].id, false);
        } else {
          await get().createProject('My Project', 'blank-vanilla');
        }
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  },

  // Duplicate a project
  duplicateProject: async (id) => {
    try {
      const copy = await dbDuplicateProject(id);
      if (copy) {
        try {
          await createSnapshot({
            projectId: copy.id,
            files: copy.files || {},
            label: `Initial (copy)`,
            source: 'initial',
          });
        } catch {}

        const updatedList = await listProjects();
        set({ projects: updatedList, isMenuOpen: false });
        await get().openProject(copy.id);
      }
    } catch (err) {
      console.error('Failed to duplicate project:', err);
    }
  },

  // UI modal and menu toggles
  openNewProjectModal: () => set({ isNewProjectModalOpen: true, isMenuOpen: false }),
  closeNewProjectModal: () => set({ isNewProjectModalOpen: false }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  closeMenu: () => set({ isMenuOpen: false }),
}));
