import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Plus,
  Download,
  Copy,
  Trash2,
  Check,
  Pencil,
  Folder,
  Atom,
  Globe,
  Wrench,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useProjectsStore } from '../store/useProjectsStore';
import { useProjectStore } from '../store/useProjectStore';
import { exportProjectZip } from '../lib/exportZip';

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ProjectMenu() {
  const {
    projects,
    currentProjectId,
    currentProjectType,
    saveStatus,
    isMenuOpen,
    openProject,
    renameProject,
    deleteProject,
    duplicateProject,
    resetReactProjectPreview,
    openNewProjectModal,
    toggleMenu,
    closeMenu,
  } = useProjectsStore();

  const { files } = useProjectStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const renameInputRef = useRef(null);
  const menuRef = useRef(null);

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const currentName = currentProject?.name || 'Untitled Project';

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      setNameInput(currentName);
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming, currentName]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, closeMenu]);

  const handleRenameSubmit = (e) => {
    e?.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== currentName && currentProjectId) {
      renameProject(currentProjectId, trimmed);
    }
    setIsRenaming(false);
  };

  const handleDownloadZip = async () => {
    const fileCount = Object.keys(files || {}).length;
    if (isExporting || fileCount === 0) return;
    setIsExporting(true);
    try {
      const result = await exportProjectZip({
        name: currentName,
        projectType: currentProjectType,
        files,
      });
      setToast({ message: `Downloaded ${result.filename}`, type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast({ message: err.message || 'Failed to export ZIP', type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsExporting(false);
      closeMenu();
    }
  };

  const handleDelete = (projId, projName) => {
    if (confirm(`Are you sure you want to delete project "${projName}"?`)) {
      deleteProject(projId);
    }
  };

  return (
    <div ref={menuRef} className="relative flex items-center gap-2 select-none">
      {/* Project Name & Selector Button */}
      {isRenaming ? (
        <form onSubmit={handleRenameSubmit} className="flex items-center gap-1">
          <input
            ref={renameInputRef}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            className="bg-slate-950 border border-indigo-500 rounded-lg px-2 py-0.5 text-xs font-semibold text-white outline-none max-w-[160px]"
          />
        </form>
      ) : (
        <button
          onClick={toggleMenu}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-xs cursor-pointer group max-w-[220px]"
          title="Switch or manage projects"
        >
          <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{currentName}</span>

          {/* Project Type Badge */}
          <span
            className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold shrink-0 ${
              currentProjectType === 'react'
                ? 'bg-sky-950 text-sky-300 border border-sky-700/50'
                : 'bg-amber-950 text-amber-300 border border-amber-700/50'
            }`}
          >
            {currentProjectType}
          </span>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              isMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {/* Inline Rename Trigger (Pencil) */}
      {!isRenaming && (
        <button
          onClick={() => setIsRenaming(true)}
          className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          title="Rename project"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}

      {/* Auto-Save Status Indicator */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-400 hidden sm:flex">
        {saveStatus === 'saving' ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="text-amber-300">Saving...</span>
          </>
        ) : saveStatus === 'error' ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span className="text-rose-400">Save Error</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Saved</span>
          </>
        )}
      </div>

      {/* Top Bar Download ZIP Button */}
      <button
        type="button"
        onClick={handleDownloadZip}
        disabled={isExporting || !files || Object.keys(files).length === 0}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 hover:border-slate-600 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
        title="Download project as ZIP file"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5 text-indigo-400" />
        )}
        <span className="hidden md:inline">{isExporting ? 'Preparing...' : 'Download ZIP'}</span>
      </button>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-3.5 py-2 rounded-xl border shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200 shadow-rose-950/50'
              : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Project Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-76 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 z-50 animate-fadeIn">
          {/* Menu Actions */}
          <div className="p-2 border-b border-slate-800 flex items-center gap-1.5">
            <button
              onClick={openNewProjectModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>

            <button
              onClick={handleDownloadZip}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
              title="Download project as ZIP"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>ZIP</span>
            </button>
          </div>

          {/* Reset Preview Action for React projects */}
          {currentProjectType === 'react' && (
            <div className="px-2 py-1.5 border-b border-slate-800 bg-slate-950/40">
              <button
                onClick={() => {
                  if (confirm('Reset core preview files (/package.json, /index.jsx, /App.jsx) to standard defaults?')) {
                    resetReactProjectPreview();
                  }
                }}
                className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 text-[11px] transition-colors cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset React Preview Defaults</span>
              </button>
            </div>
          )}

          {/* Project List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              All Projects ({projects.length})
            </div>

            {projects.map((proj) => {
              const isCurrent = proj.id === currentProjectId;
              const type = proj.projectType || 'vanilla';
              return (
                <div
                  key={proj.id}
                  onClick={() => openProject(proj.id)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-xs transition-all ${
                    isCurrent
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      <span className="truncate">{proj.name}</span>
                      <span
                        className={`px-1 rounded text-[8px] font-mono uppercase font-bold shrink-0 ${
                          type === 'react'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                        }`}
                      >
                        {type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono font-normal">
                      {formatRelativeTime(proj.updatedAt)}
                    </p>
                  </div>

                  {/* Actions (Duplicate / Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateProject(proj.id);
                      }}
                      className="p-1 hover:text-indigo-300 hover:bg-slate-700 rounded text-slate-400 transition-colors"
                      title="Duplicate project"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(proj.id, proj.name);
                      }}
                      className="p-1 hover:text-rose-400 hover:bg-slate-700 rounded text-slate-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
