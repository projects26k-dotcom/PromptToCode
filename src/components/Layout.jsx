import React, { useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import {
  Sparkles,
  Settings,
  Code2,
  Columns,
  Play,
  AlertTriangle,
  RotateCcw,
  History,
  X
} from 'lucide-react';
import FileTree from './FileTree';
import EditorTabs from './EditorTabs';
import CodeEditor from './CodeEditor';
import PreviewPanel from './PreviewPanel';
import ChatPanel from './ChatPanel';
import SettingsModal from './SettingsModal';
import ProjectMenu from './ProjectMenu';
import NewProjectModal from './NewProjectModal';
import TimelinePanel from './TimelinePanel';
import RestoreDialog from './RestoreDialog';
import { useSettingsStore } from '../store/useSettingsStore';
import { useProjectsStore } from '../store/useProjectsStore';
import { useSnapshotStore } from '../store/useSnapshotStore';

export default function Layout() {
  const { viewMode, setViewMode, openSettings } = useSettingsStore();
  const { initProjects, saveCurrentProjectNow, loadError, resetCorruptedProject } = useProjectsStore();
  const {
    snapshots,
    isTimelineOpen,
    toggleTimeline,
    undoRestoreState,
    undoRestore,
    clearUndoRestore,
  } = useSnapshotStore();

  // Initialize projects on app start and register beforeunload save
  useEffect(() => {
    initProjects();

    const handleBeforeUnload = () => {
      saveCurrentProjectNow();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [initProjects, saveCurrentProjectNow]);

  // Global keyboard shortcut: Ctrl+Shift+H / Cmd+Shift+H to toggle history
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        toggleTimeline();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimeline]);

  if (loadError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 select-none">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center mb-4 shadow-xl shadow-rose-950/50">
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100 mb-1">Project Load Error</h2>
        <p className="text-xs text-slate-400 max-w-md text-center mb-4 font-mono bg-slate-900 border border-slate-800 p-3 rounded-xl">
          {loadError.message || 'The saved project data could not be parsed or loaded.'}
        </p>
        <button
          onClick={resetCorruptedProject}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset this project</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-12 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none z-10">
        {/* Left: Branding & Project Menu */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent hidden sm:inline">
              VibeForge
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Project Menu & Auto-Save */}
          <ProjectMenu />
        </div>

        {/* Center: View Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'code'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Code only view"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Code</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split view (Code & Preview)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Preview only view"
          >
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>

        {/* Right: Status, History & Settings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] font-mono text-slate-400 hidden md:flex">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>AI Editor</span>
          </div>

          <button
            onClick={toggleTimeline}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs cursor-pointer ${
              isTimelineOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/60 hover:border-slate-600 text-slate-300 hover:text-white'
            }`}
            title="Version Timeline (Ctrl+Shift+H)"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>History</span>
            {snapshots.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-900 text-indigo-300 border border-slate-700">
                {snapshots.length}
              </span>
            )}
          </button>

          <button
            onClick={openSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 hover:border-slate-600 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-xs cursor-pointer"
            title="AI Settings"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Resizable Area */}
      <div className="flex-1 w-full overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Panel 1: File Explorer */}
          <Panel defaultSize={16} minSize={12} maxSize={28}>
            <FileTree />
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-indigo-500 active:bg-indigo-600 transition-colors cursor-col-resize select-none" />

          {/* Panel 2: Editor (Shown in 'code' or 'split' mode) */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <>
              <Panel
                defaultSize={viewMode === 'split' ? 34 : 58}
                minSize={20}
              >
                <div className="h-full w-full flex flex-col bg-slate-950 overflow-hidden">
                  <EditorTabs />
                  <div className="flex-1 w-full overflow-hidden">
                    <CodeEditor />
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-indigo-500 active:bg-indigo-600 transition-colors cursor-col-resize select-none" />
            </>
          )}

          {/* Panel 3: Live Preview & Console (Shown in 'preview' or 'split' mode) */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <>
              <Panel
                defaultSize={viewMode === 'split' ? 30 : 58}
                minSize={20}
              >
                <PreviewPanel />
              </Panel>
              <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-indigo-500 active:bg-indigo-600 transition-colors cursor-col-resize select-none" />
            </>
          )}

          {/* Panel 4: AI Chat Panel */}
          <Panel
            defaultSize={viewMode === 'split' ? 20 : 26}
            minSize={16}
            maxSize={45}
          >
            <ChatPanel />
          </Panel>
        </PanelGroup>
      </div>

      {/* Slide-Over Version Timeline Panel */}
      <TimelinePanel />

      {/* Snapshot Restore Confirmation Modal */}
      <RestoreDialog />

      {/* 10-Second Undo Restore Floating Toast */}
      {undoRestoreState && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-indigo-500/60 text-xs text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Restored snapshot <strong>{undoRestoreState.restoredSnapshotLabel}</strong>.
            </span>
          </div>
          <button
            onClick={undoRestore}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Undo
          </button>
          <button
            onClick={clearUndoRestore}
            className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <SettingsModal />
      <NewProjectModal />
    </div>
  );
}
