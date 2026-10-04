import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../store/useProjectStore';
import { usePendingStore } from '../store/usePendingStore';
import { useSnapshotStore } from '../store/useSnapshotStore';
import { useChatStore } from '../store/useChatStore';
import { getLanguage } from '../lib/language';
import { Code2, Sparkles, FilePlus, Lock, HelpCircle } from 'lucide-react';
import DiffReview from './DiffReview';
import PendingChangesBar from './PendingChangesBar';

export default function CodeEditor() {
  const { files, activeFile, updateFileContent, createFile } = useProjectStore();
  const { reviewingFile, pending } = usePendingStore();
  const previewingSnapshot = useSnapshotStore((state) => state.previewingSnapshot);
  const sendExplainSelectionRequest = useChatStore((state) => state.sendExplainSelectionRequest);

  const editorRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');

  // Configure Monaco for JSX and suppress missing React type squiggles
  const handleBeforeMount = (monaco) => {
    try {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React,
        allowJs: true,
        allowNonTsExtensions: true,
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React,
        allowJs: true,
        allowNonTsExtensions: true,
      });
    } catch (err) {
      console.warn('Monaco configuration warning:', err);
    }
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register context menu action
    editor.addAction({
      id: 'explain-selection-ai',
      label: 'Explain selection with AI',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (ed) => {
        const selection = ed.getSelection();
        const model = ed.getModel();
        if (selection && model) {
          const text = model.getValueInRange(selection);
          if (text && text.trim()) {
            sendExplainSelectionRequest({
              code: text,
              file: activeFile,
            });
          }
        }
      },
    });

    // Track text selections for floating Explain button
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      const model = editor.getModel();
      if (selection && model && !selection.isEmpty()) {
        const text = model.getValueInRange(selection);
        if (text && text.trim().length > 0) {
          setSelectedText(text);
          return;
        }
      }
      setSelectedText('');
    });
  };

  const handleExplainClick = () => {
    if (!selectedText.trim()) return;
    sendExplainSelectionRequest({
      code: selectedText,
      file: activeFile,
    });
  };

  // If a pending change is currently being reviewed in the diff view
  if (reviewingFile && pending[reviewingFile]) {
    return (
      <div className="h-full w-full flex flex-col overflow-hidden">
        <PendingChangesBar />
        <div className="flex-1 w-full overflow-hidden">
          <DiffReview />
        </div>
      </div>
    );
  }

  const fileContent = activeFile !== null && files[activeFile] !== undefined ? files[activeFile] : null;
  const language = activeFile ? getLanguage(activeFile) : 'plaintext';

  // Empty state when no file is active / open
  if (!activeFile || fileContent === null) {
    return (
      <div className="h-full w-full flex flex-col bg-slate-950 overflow-hidden">
        <PendingChangesBar />
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
            <Code2 className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-1">
            No File Open
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            Select a file from the explorer on the left or create a new one to start vibe coding.
          </p>
          <button
            onClick={() => {
              const name = prompt('Enter new file name (e.g. App.jsx):');
              if (name) createFile(name);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>Create New File</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] overflow-hidden relative">
      <PendingChangesBar />

      {previewingSnapshot && (
        <div className="px-3 py-1.5 bg-amber-950/80 border-b border-amber-600/50 text-amber-200 text-xs flex items-center justify-between gap-2 shrink-0 animate-in fade-in select-none">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Snapshot Preview Active (Read-Only)</span>
          </div>
          <span className="text-[10px] text-amber-300/80">Exit preview in preview panel to edit</span>
        </div>
      )}

      <div className="flex-1 w-full overflow-hidden relative">
        <Editor
          height="100%"
          width="100%"
          theme="vs-dark"
          path={activeFile}
          keepCurrentModel={true}
          language={language}
          value={fileContent}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          onChange={(value) => {
            if (!previewingSnapshot) {
              updateFileContent(activeFile, value ?? '');
            }
          }}
          options={{
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
            fontSize: 14,
            lineHeight: 22,
            minimap: { enabled: true },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            tabSize: 2,
            wordWrap: 'on',
            readOnly: !!previewingSnapshot,
            hover: { enabled: false },
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
          }}
          loading={
            <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-slate-400 text-sm font-mono">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-400 mr-2" />
              Loading Editor...
            </div>
          }
        />

        {/* Floating Explain Selection button when code is selected */}
        {selectedText && (
          <div className="absolute bottom-5 right-6 z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={handleExplainClick}
              title="Explain selected code with AI in chat"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium shadow-lg shadow-indigo-900/50 border border-indigo-400/30 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Explain</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
