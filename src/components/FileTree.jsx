import React, { useState, useRef, useEffect } from 'react';
import {
  File,
  FileCode,
  FileJson,
  FileText,
  FilePlus,
  Pencil,
  Trash2,
  Check,
  X,
  FolderOpen,
  GitPullRequest
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { usePendingStore } from '../store/usePendingStore';

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
    case 'css':
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-amber-300 shrink-0" />;
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'md':
      return <FileText className="w-4 h-4 text-purple-400 shrink-0" />;
    case 'py':
      return <FileCode className="w-4 h-4 text-yellow-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  }
}

export default function FileTree() {
  const { files, activeFile, openFile, createFile, deleteFile, renameFile } =
    useProjectStore();
  const { pending, reviewingFile, reviewFile, closeReview, clearPendingForFile } =
    usePendingStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFile, setEditingFile] = useState(null);
  const [editFileName, setEditFileName] = useState('');

  const newFileInputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (isCreating && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (editingFile && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingFile]);

  const handleCreateSubmit = (e) => {
    e?.preventDefault();
    const trimmed = newFileName.trim();
    if (trimmed) {
      createFile(trimmed);
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleRenameSubmit = (e) => {
    e?.preventDefault();
    const trimmed = editFileName.trim();
    if (trimmed && editingFile) {
      clearPendingForFile(editingFile);
      renameFile(editingFile, trimmed);
      setEditingFile(null);
      setEditFileName('');
    }
  };

  const handleDelete = (filename) => {
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      clearPendingForFile(filename);
      deleteFile(filename);
    }
  };

  // Combine accepted project files with any brand-new files currently pending
  const projectFileKeys = Object.keys(files);
  const newPendingKeys = Object.keys(pending).filter((p) => !(p in files));
  const allFiles = Array.from(new Set([...projectFileKeys, ...newPendingKeys])).sort();

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none">
      {/* Explorer Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Explorer</span>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setNewFileName('');
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="New File"
        >
          <FilePlus className="w-3.5 h-3.5 text-indigo-400" />
          <span>New</span>
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Inline New File Form */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded border border-indigo-500/50"
          >
            <File className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={newFileInputRef}
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.ext"
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <button
              type="submit"
              className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
              title="Confirm"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* File Rows */}
        {allFiles.map((filename) => {
          const pendingItem = pending[filename];
          const isPending = !!pendingItem;
          const isReviewing = reviewingFile === filename;
          const isActive = !reviewingFile && activeFile === filename;
          const isEditing = editingFile === filename;

          if (isEditing) {
            return (
              <form
                key={filename}
                onSubmit={handleRenameSubmit}
                className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/90 rounded border border-indigo-500/50"
              >
                {getFileIcon(filename)}
                <input
                  ref={editInputRef}
                  type="text"
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingFile(null);
                  }}
                />
                <button
                  type="submit"
                  className="text-emerald-400 hover:text-emerald-300 p-0.5"
                  title="Save"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="text-slate-400 hover:text-slate-200 p-0.5"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            );
          }

          return (
            <div
              key={filename}
              onClick={() => {
                if (isPending) {
                  reviewFile(filename);
                } else {
                  if (reviewingFile) closeReview();
                  openFile(filename);
                }
              }}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer text-xs font-mono transition-all duration-150 ${
                isReviewing
                  ? 'bg-indigo-950/70 text-indigo-200 border-l-2 border-indigo-500 pl-2 font-medium shadow-xs'
                  : isActive
                  ? 'bg-indigo-600/20 text-indigo-200 border-l-2 border-indigo-500 pl-2'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(filename)}
                <span className="truncate">{filename}</span>

                {/* Pending Badges */}
                {isPending && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      pendingItem.isNew ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    title={
                      pendingItem.isNew
                        ? 'New file proposed by AI (click to review)'
                        : 'Modified by AI (click to review)'
                    }
                  />
                )}
              </div>

              {/* Action Buttons (Rename / Delete) */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isPending ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reviewFile(filename);
                    }}
                    className="p-1 hover:text-indigo-300 text-indigo-400 hover:bg-slate-700/50 rounded transition-colors"
                    title="Review AI diff"
                  >
                    <GitPullRequest className="w-3 h-3" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFile(filename);
                        setEditFileName(filename);
                      }}
                      className="p-1 hover:text-indigo-400 hover:bg-slate-700/50 rounded transition-colors text-slate-400"
                      title="Rename"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(filename);
                      }}
                      className="p-1 hover:text-rose-400 hover:bg-slate-700/50 rounded transition-colors text-slate-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {allFiles.length === 0 && !isCreating && (
          <div className="text-center py-6 text-xs text-slate-500">
            No files in project
          </div>
        )}
      </div>
    </div>
  );
}
