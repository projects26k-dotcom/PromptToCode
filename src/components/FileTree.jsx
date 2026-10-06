import React, { useState, useRef, useEffect } from 'react';
import {
  File,
  FileCode,
  FileJson,
  FileText,
  FilePlus,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  X,
  GitPullRequest,
  PanelLeftClose
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { usePendingStore } from '../store/usePendingStore';
import { useSettingsStore } from '../store/useSettingsStore';

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    case 'css':
      return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    case 'ts':
    case 'tsx':
      return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'md':
      return <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case 'py':
      return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    default:
      return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
}

/**
 * Builds a hierarchical tree from file paths and empty folders
 */
function buildTree(filePaths, emptyFolders = []) {
  const root = { type: 'folder', name: '', path: '', children: {} };

  const ensureFolder = (folderPath) => {
    const clean = folderPath.replace(/^\/+|\/+$/g, '');
    if (!clean) return root;
    const parts = clean.split('/').filter(Boolean);
    let current = root;
    let currentPath = '';

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
      if (!current.children[part]) {
        current.children[part] = {
          type: 'folder',
          name: part,
          path: currentPath,
          children: {},
        };
      }
      current = current.children[part];
    }
    return current;
  };

  // Add explicit empty folders
  for (const f of emptyFolders) {
    if (f) ensureFolder(f);
  }

  // Add all files
  for (const rawPath of filePaths) {
    const clean = rawPath.replace(/^\/+|\/+$/g, '');
    if (!clean) continue;
    const parts = clean.split('/').filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) continue;

    let current = root;
    let currentPath = '';

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
      if (!current.children[part]) {
        current.children[part] = {
          type: 'folder',
          name: part,
          path: currentPath,
          children: {},
        };
      }
      current = current.children[part];
    }

    current.children[fileName] = {
      type: 'file',
      name: fileName,
      path: rawPath.startsWith('/') ? rawPath : `/${rawPath}`,
      originalKey: rawPath,
    };
  }

  const toArray = (node) => {
    const items = Object.values(node.children);
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    for (const item of items) {
      if (item.type === 'folder') {
        item.children = toArray(item);
      }
    }
    return items;
  };

  return toArray(root);
}

/**
 * Helper to get all ancestor folder paths for a file
 * e.g. "/public/nested/index.html" -> ["/public", "/public/nested"]
 */
function getAncestorFolders(filePath) {
  if (!filePath) return [];
  const clean = filePath.replace(/^\/+|\/+$/g, '');
  const parts = clean.split('/').filter(Boolean);
  parts.pop(); // remove file name

  const ancestors = [];
  let current = '';
  for (const part of parts) {
    current = current ? `${current}/${part}` : `/${part}`;
    ancestors.push(current);
  }
  return ancestors;
}

export default function FileTree() {
  const {
    files,
    emptyFolders = [],
    activeFile,
    openFile,
    createFile,
    createFolder,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
  } = useProjectStore();

  const { pending, reviewingFile, reviewFile, closeReview, clearPendingForFile } =
    usePendingStore();
  const { toggleSidebar } = useSettingsStore();

  // Expanded folders set: default only contains active/reviewing file's parent folders
  const [expandedFolders, setExpandedFolders] = useState(() => {
    const targetFile = reviewingFile || activeFile;
    return new Set(getAncestorFolders(targetFile));
  });

  // Auto-expand folder when active file or reviewing file changes
  useEffect(() => {
    const targetFile = reviewingFile || activeFile;
    if (targetFile) {
      const ancestors = getAncestorFolders(targetFile);
      if (ancestors.length > 0) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          ancestors.forEach((f) => next.add(f));
          return next;
        });
      }
    }
  }, [activeFile, reviewingFile]);

  // Creation state: { type: 'file' | 'folder', parentPath: string } | null
  const [creating, setCreating] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  // Renaming state: { type: 'file' | 'folder', path: string, originalKey?: string } | null
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');

  const createInputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (creating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [creating]);

  useEffect(() => {
    if (editingItem && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingItem]);

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const handleStartCreate = (type, parentPath = '') => {
    // If creating inside a folder, ensure it is expanded
    if (parentPath) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add(parentPath);
        return next;
      });
    }
    setCreating({ type, parentPath });
    setNewItemName('');
  };

  const handleCreateSubmit = (e) => {
    e?.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed || !creating) return;

    const prefix = creating.parentPath
      ? (creating.parentPath.startsWith('/') ? creating.parentPath.slice(1) : creating.parentPath)
      : '';
    const fullPath = prefix ? `${prefix}/${trimmed}` : trimmed;

    if (creating.type === 'folder') {
      createFolder(fullPath);
    } else {
      createFile(fullPath);
    }

    setCreating(null);
    setNewItemName('');
  };

  const handleRenameSubmit = (e) => {
    e?.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed || !editingItem) return;

    if (editingItem.type === 'folder') {
      const parts = editingItem.path.replace(/^\/+|\/+$/g, '').split('/');
      parts[parts.length - 1] = trimmed;
      const newFolderPath = parts.join('/');
      renameFolder(editingItem.path, newFolderPath);
    } else {
      const originalKey = editingItem.originalKey || editingItem.path;
      const parts = originalKey.replace(/^\/+|\/+$/g, '').split('/');
      parts[parts.length - 1] = trimmed;
      const newFilePath = (originalKey.startsWith('/') ? '/' : '') + parts.join('/');
      renameFile(originalKey, newFilePath);
    }

    setEditingItem(null);
    setEditName('');
  };

  const handleDeleteFile = (path, originalKey) => {
    const keyToDelete = originalKey || path;
    if (confirm(`Delete file "${keyToDelete}"?`)) {
      clearPendingForFile(keyToDelete);
      deleteFile(keyToDelete);
    }
  };

  const handleDeleteFolder = (folderPath) => {
    if (confirm(`Delete folder "${folderPath}" and all files inside?`)) {
      deleteFolder(folderPath);
    }
  };

  // Combine accepted project files with any brand-new files currently pending
  const projectFileKeys = Object.keys(files);
  const newPendingKeys = Object.keys(pending).filter((p) => !(p in files));
  const allFileKeys = Array.from(new Set([...projectFileKeys, ...newPendingKeys]));

  const tree = buildTree(allFileKeys, emptyFolders);

  // Recursive Tree Node Renderer
  const renderNode = (node, depth = 0) => {
    const indentStyle = { paddingLeft: `${depth * 12 + 8}px` };

    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.path);
      const isEditingThis = editingItem?.type === 'folder' && editingItem.path === node.path;
      const isCreatingInside = creating && creating.parentPath === node.path;

      return (
        <div key={`folder-${node.path}`} className="flex flex-col">
          {isEditingThis ? (
            <form
              onSubmit={handleRenameSubmit}
              style={indentStyle}
              className="flex items-center gap-1.5 py-1 px-2 bg-slate-800/90 rounded border border-indigo-500/50 my-0.5"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <input
                ref={editInputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white outline-none font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingItem(null);
                }}
              />
              <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div
              onClick={() => toggleFolder(node.path)}
              style={indentStyle}
              className="group flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer text-xs font-mono transition-colors text-slate-300 hover:bg-slate-800/60 hover:text-white select-none"
            >
              <div className="flex items-center gap-1.5 truncate min-w-0">
                <span className="text-slate-400 group-hover:text-slate-200 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className="font-semibold text-slate-200 truncate">{node.name}</span>
              </div>

              {/* Folder Actions */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <button
                  type="button"
                  onClick={() => handleStartCreate('file', node.path)}
                  className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-700/60 rounded cursor-pointer"
                  title="New File in folder"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStartCreate('folder', node.path)}
                  className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-700/60 rounded cursor-pointer"
                  title="New Subfolder"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem({ type: 'folder', path: node.path });
                    setEditName(node.name);
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/60 rounded cursor-pointer"
                  title="Rename folder"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(node.path)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded cursor-pointer"
                  title="Delete folder"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Children when expanded */}
          {isExpanded && (
            <div className="flex flex-col border-l border-slate-800/50 ml-3.5 pl-0.5">
              {/* Inline Create Form inside this folder */}
              {isCreatingInside && (
                <form
                  onSubmit={handleCreateSubmit}
                  style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
                  className="flex items-center gap-1.5 py-1 px-2 bg-slate-800/80 rounded border border-indigo-500/50 my-0.5"
                >
                  {creating.type === 'folder' ? (
                    <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <input
                    ref={createInputRef}
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={creating.type === 'folder' ? 'folder-name' : 'filename.ext'}
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setCreating(null);
                    }}
                  />
                  <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setCreating(null)} className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {node.children.map((child) => renderNode(child, depth + 1))}

              {node.children.length === 0 && !isCreatingInside && (
                <div
                  style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
                  className="py-1 text-[11px] text-slate-600 italic select-none"
                >
                  (empty folder)
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Render File Node
    const isPending = !!pending[node.originalKey || node.path];
    const pendingItem = pending[node.originalKey || node.path];
    const isReviewing = reviewingFile === (node.originalKey || node.path);
    const isActive = !reviewingFile && (activeFile === node.path || activeFile === node.originalKey);
    const isEditingThis = editingItem?.type === 'file' && editingItem.path === node.path;

    if (isEditingThis) {
      return (
        <form
          key={`file-${node.path}`}
          onSubmit={handleRenameSubmit}
          style={indentStyle}
          className="flex items-center gap-1.5 py-1 px-2 bg-slate-800/90 rounded border border-indigo-500/50 my-0.5"
        >
          {getFileIcon(node.name)}
          <input
            ref={editInputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white outline-none font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditingItem(null);
            }}
          />
          <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={`file-${node.path}`}
        onClick={() => {
          const targetKey = node.originalKey || node.path;
          if (isPending) {
            reviewFile(targetKey);
          } else {
            if (reviewingFile) closeReview();
            openFile(targetKey);
          }
        }}
        style={indentStyle}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer text-xs font-mono transition-all duration-150 ${
          isReviewing
            ? 'bg-indigo-950/70 text-indigo-200 border-l-2 border-indigo-500 font-medium shadow-xs'
            : isActive
            ? 'bg-indigo-600/20 text-indigo-200 border-l-2 border-indigo-500'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {getFileIcon(node.name)}
          <span className="truncate">{node.name}</span>

          {/* Pending Badges */}
          {isPending && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                pendingItem?.isNew ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              title={
                pendingItem?.isNew
                  ? 'New file proposed by AI (click to review)'
                  : 'Modified by AI (click to review)'
              }
            />
          )}
        </div>

        {/* File Actions */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          {isPending ? (
            <button
              type="button"
              onClick={() => reviewFile(node.originalKey || node.path)}
              className="p-1 hover:text-indigo-300 text-indigo-400 hover:bg-slate-700/50 rounded transition-colors cursor-pointer"
              title="Review AI diff"
            >
              <GitPullRequest className="w-3 h-3" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingItem({
                    type: 'file',
                    path: node.path,
                    originalKey: node.originalKey || node.path,
                  });
                  setEditName(node.name);
                }}
                className="p-1 hover:text-indigo-400 hover:bg-slate-700/50 rounded transition-colors text-slate-400 cursor-pointer"
                title="Rename file"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFile(node.path, node.originalKey)}
                className="p-1 hover:text-rose-400 hover:bg-slate-700/50 rounded transition-colors text-slate-400 cursor-pointer"
                title="Delete file"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none">
      {/* Explorer Header with Actions */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">Explorer</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* New File Button */}
          <button
            type="button"
            onClick={() => handleStartCreate('file', '')}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="New File at Root"
          >
            <FilePlus className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          {/* New Folder Button */}
          <button
            type="button"
            onClick={() => handleStartCreate('folder', '')}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="New Folder at Root"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Collapse Sidebar Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse Explorer (Ctrl+B)"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File & Folder Tree Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Root-level Inline Creation Form */}
        {creating && !creating.parentPath && (
          <form
            onSubmit={handleCreateSubmit}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded border border-indigo-500/50 my-1"
          >
            {creating.type === 'folder' ? (
              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <input
              ref={createInputRef}
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={creating.type === 'folder' ? 'folder-name' : 'filename.ext'}
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setCreating(null);
              }}
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setCreating(null)} className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Tree Items */}
        {tree.map((node) => renderNode(node, 0))}

        {tree.length === 0 && !creating && (
          <div className="text-center py-6 text-xs text-slate-500">
            No files or folders in project
          </div>
        )}
      </div>
    </div>
  );
}
