import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  User,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Maximize2,
  ListChecks,
  X
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { usePendingStore } from '../store/usePendingStore';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSnapshotStore } from '../store/useSnapshotStore';
import { stripFileBlocks, extractFilePaths } from '../lib/ai/parseResponse';
import { getDiffStats } from '../lib/diff';

import ExplanationCard from './ExplanationCard';
import QuizCard from './QuizCard';
import PlanCard from './PlanCard';

export default function ChatMessage({ message }) {
  const { openFile } = useProjectStore();
  const { pending, fileHistory, reviewFile } = usePendingStore();
  const [selectedImage, setSelectedImage] = useState(null);

  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  // For assistant messages, strip raw code blocks and explain blocks for clean markdown reading
  const displayContent = isUser ? message.content : stripFileBlocks(message.content);

  // Files extracted from this message
  const rawFilePaths = message.appliedFiles && message.appliedFiles.length > 0
    ? message.appliedFiles.map((f) => f.path)
    : extractFilePaths(message.content);

  // Explanations for this message
  const explanations = message.explanations || [];

  // Detect if assistant provided fenced code blocks that could not be parsed into any files
  const isPlan = Boolean(message.plan || message.planStatus || /```plan[\s\S]*?```/i.test(message.content || ''));
  const isExplanationOnly = Boolean(
    (message.explanations && message.explanations.length > 0) ||
    message.userPrompt?.startsWith('Explain') ||
    message.displayContent?.includes('Explain')
  );

  const nonPlanExplainCode = (message.content || '')
    .replace(/```plan[\s\S]*?```/gi, '')
    .replace(/```explain:[^\n\r]*[\r\n]+[\s\S]*?```/gi, '');

  const hasFencedCode = /```[\s\S]*?```/.test(nonPlanExplainCode);
  const showFormatWarning = !isUser && !isStreaming && !isError && !isPlan && !isExplanationOnly && hasFencedCode && rawFilePaths.length === 0;

  const handleRetryWithFormatReminder = () => {
    let promptToRetry = message.userPrompt;
    if (!promptToRetry) {
      const allMsgs = useChatStore.getState().messages;
      const msgIdx = allMsgs.findIndex((m) => m.id === message.id);
      if (msgIdx > 0) {
        for (let i = msgIdx - 1; i >= 0; i--) {
          if (allMsgs[i].role === 'user') {
            promptToRetry = allMsgs[i].content;
            break;
          }
        }
      }
    }
    if (promptToRetry) {
      useChatStore.getState().retryWithFormatReminder(promptToRetry);
    }
  };

  // System notice banner (e.g. feedback on early exits / pending changes warnings)
  if (message.role === 'system') {
    const isErr = message.noticeType === 'error';
    const pendingKeys = Object.keys(pending);

    return (
      <div
        className={`w-full my-1 flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs shadow-xs animate-in fade-in duration-200 ${
          isErr
            ? 'bg-rose-950/80 border-rose-600/50 text-rose-200'
            : 'bg-amber-950/70 border-amber-500/40 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {isErr ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{message.content}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(message.action === 'review' || (pendingKeys.length > 0 && message.content.includes('pending'))) && (
            <button
              onClick={() => {
                if (pendingKeys.length > 0) {
                  reviewFile(pendingKeys[0]);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shadow-xs cursor-pointer shrink-0"
            >
              <GitPullRequest className="w-3 h-3" />
              <span>Review</span>
            </button>
          )}

          {message.action === 'retryWithContext' && (
            <button
              onClick={() => {
                useChatStore.getState().sendFixRequest(message.actionErrors, true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] shadow-xs cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              <span>Try again with more context</span>
            </button>
          )}

          {message.action === 'settings' && (
            <button
              onClick={() => useSettingsStore.getState().openSettings()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-xs cursor-pointer shrink-0"
            >
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar Icon */}
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isUser
              ? 'bg-indigo-600 text-white'
              : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
          }`}
        >
          {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
        </div>

        {/* Message Content Bubble */}
        <div
          className={`flex flex-col max-w-[85%] space-y-2.5 ${
            isUser ? 'items-end' : 'items-start'
          }`}
        >
          <div
            className={`px-3.5 py-2.5 rounded-2xl ${
              isUser
                ? 'bg-indigo-600/90 text-white rounded-tr-xs shadow-md shadow-indigo-600/10'
                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs shadow-sm'
            }`}
          >
            {isUser ? (
              <div className="space-y-2">
                {message.isAutoFix && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-indigo-300" />
                    <span>Auto-fix</span>
                  </div>
                )}

                {/* Attached Image Thumbnails */}
                {message.images && message.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {message.images.map((img, idx) => {
                      const imgSrc = img.thumbnail || img.previewUrl || (img.base64 ? `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}` : null);
                      if (!imgSrc) return null;

                      return (
                        <div
                          key={img.id || idx}
                          onClick={() => setSelectedImage(img)}
                          className="relative group rounded-xl overflow-hidden border border-white/20 bg-slate-950/60 cursor-pointer shadow-sm hover:ring-2 hover:ring-white/40 transition-all max-w-[140px]"
                        >
                          <img
                            src={imgSrc}
                            alt={img.name || 'attachment'}
                            className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Maximize2 className="w-4 h-4 drop-shadow" />
                          </div>
                          {img.name && (
                            <div className="p-1 bg-black/50 backdrop-blur-xs text-[9px] text-slate-200 truncate px-1.5">
                              {img.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {message.displayContent ? (
                  <div className="flex items-center gap-2 py-0.5 text-emerald-200 font-medium text-xs">
                    <ListChecks className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>{message.displayContent}</span>
                  </div>
                ) : (
                  <div className="markdown-content text-white text-xs leading-relaxed break-words [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-1 [&_ol]:my-1.5 [&_li]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-white [&_em]:italic [&_code]:bg-indigo-700/60 [&_code]:text-indigo-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[11px] [&_code]:border [&_code]:border-indigo-400/30 [&_pre]:bg-slate-950/80 [&_pre]:p-2.5 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-indigo-400/20 [&_pre]:font-mono [&_pre]:text-[11px] [&_pre]:overflow-x-auto [&_pre]:my-1.5 [&_pre]:text-slate-200 [&_blockquote]:border-l-2 [&_blockquote]:border-white/40 [&_blockquote]:pl-2.5 [&_blockquote]:italic [&_blockquote]:my-1 [&_blockquote]:text-slate-100 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-indigo-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Markdown Rendered AI Response */}
                {displayContent ? (
                  <div className="markdown-content text-slate-200 text-xs leading-relaxed break-words space-y-2 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-1 [&_ol]:my-2 [&_li]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-indigo-300 [&_em]:italic [&_em]:text-slate-300 [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:border-b [&_h1]:border-slate-800 [&_h1]:pb-1 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:text-indigo-200 [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-slate-200 [&_h3]:mt-2 [&_h3]:mb-1 [&_code]:bg-slate-800/90 [&_code]:text-indigo-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[11px] [&_code]:border [&_code]:border-slate-700/60 [&_pre]:bg-slate-950 [&_pre]:p-2.5 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-slate-800 [&_pre]:font-mono [&_pre]:text-[11px] [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:text-slate-200 [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:text-slate-300 [&_a]:text-indigo-400 [&_a:hover]:text-indigo-300 [&_a]:underline [&_a]:underline-offset-2 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-800 [&_table]:my-2 [&_table]:text-[11px] [&_th]:border [&_th]:border-slate-800 [&_th]:bg-slate-800/70 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-200 [&_td]:border [&_td]:border-slate-800 [&_td]:px-2 [&_td]:py-1 [&_td]:text-slate-300 [&_hr]:border-slate-800 [&_hr]:my-2.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {displayContent}
                    </ReactMarkdown>
                  </div>
                ) : rawFilePaths.length > 0 && !isStreaming ? (
                  <p className="text-slate-300 font-medium">
                    Forged {rawFilePaths.length} file{rawFilePaths.length > 1 ? 's' : ''} for review:
                  </p>
                ) : isStreaming ? (
                  <div className="flex items-center gap-2 text-slate-400 font-mono py-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span>{message.planStatus ? 'Planning solution...' : 'Thinking & forging code...'}</span>
                  </div>
                ) : null}

                {/* Plan Mode: Plan Card */}
                {!isUser && (message.plan || message.planStatus) && (
                  <PlanCard message={message} />
                )}

              {/* Error Display */}
              {isError && (
                <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="text-[11px] font-sans">
                    <p className="font-semibold">Error generating response</p>
                    <p className="text-rose-300/80">{message.error || 'Something went wrong.'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Diff-First File Chips */}
        {!isUser && rawFilePaths.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {rawFilePaths.map((filePath, idx) => {
              const pendingItem = pending[filePath];
              const historyKey = `${message.id}:${filePath}`;
              const historyStatus = fileHistory[historyKey] || fileHistory[filePath];

              // 1. Currently Pending
              if (pendingItem) {
                const { added, removed } = getDiffStats(
                  pendingItem.original,
                  pendingItem.proposed
                );

                return (
                  <button
                    key={idx}
                    onClick={() => reviewFile(filePath)}
                    className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-500/40 hover:border-indigo-400 text-[11px] font-mono text-indigo-200 transition-all shadow-xs cursor-pointer"
                    title="Click to review diff"
                  >
                    <GitPullRequest className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span className="font-semibold text-slate-300 group-hover:text-white">
                      Pending: {filePath}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">+{added}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-[10px] text-rose-400 font-semibold">-{removed}</span>
                  </button>
                );
              }

              // 2. Previously Rejected
              if (historyStatus === 'rejected') {
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400"
                  >
                    <XCircle className="w-3 h-3 text-rose-400" />
                    <span className="line-through text-slate-400">{filePath}</span>
                    <span className="text-[10px] text-rose-400/80">Rejected</span>
                  </div>
                );
              }

              // 3. Accepted (default if no longer pending)
              return (
                <button
                  key={idx}
                  onClick={() => openFile(filePath)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-mono text-slate-300 hover:text-white transition-all shadow-xs cursor-pointer"
                  title="Click to open file in editor"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-indigo-300 underline underline-offset-2">
                    {filePath}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Accepted</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Restore to before this link & Explain this change link */}
        {!isUser && rawFilePaths.length > 0 && !isStreaming && (
          <div className="pt-0.5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const { openRestoreDialog, snapshots } = useSnapshotStore.getState();
                let targetSnap = snapshots.find(
                  (s) => s.messageId === message.id && s.source === 'before-ai'
                );
                if (!targetSnap) {
                  targetSnap = snapshots.find((s) => s.messageId === message.id);
                }
                if (!targetSnap && snapshots.length > 0) {
                  targetSnap = snapshots[snapshots.length - 1];
                }
                if (targetSnap) {
                  openRestoreDialog(targetSnap);
                }
              }}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer group"
              title="Restore project to how it was before this AI response"
            >
              <RotateCcw className="w-3 h-3 text-slate-400 group-hover:text-indigo-300" />
              <span className="underline underline-offset-2">Restore to before this</span>
            </button>

            {/* Optional Explain this change link if AI omitted explain blocks */}
            {explanations.length === 0 && (
              <button
                onClick={() => {
                  useChatStore.getState().requestExplanationOnly(message);
                }}
                className="flex items-center gap-1 text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer"
                title="Ask AI to explain these changes step by step"
              >
                <span>💡 Explain this change</span>
              </button>
            )}
          </div>
        )}

        {/* Learn Mode: Explanation Cards */}
        {!isUser && explanations.length > 0 && (
          <div className="w-full space-y-2 pt-1">
            {explanations.map((exp, idx) => (
              <ExplanationCard
                key={idx}
                explanation={exp}
                defaultExpanded={idx === 0}
              />
            ))}

            {/* Quiz Component */}
            <QuizCard explanations={explanations} messageId={message.id} />
          </div>
        )}

        {/* Yellow Format Warning if AI output fenced code blocks without proper file headers */}
        {showFormatWarning && (
          <div className="w-full flex flex-col gap-2.5 p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs shadow-md animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed flex-1 min-w-0">
                The AI didn't use the file format, so nothing was applied.
              </span>
            </div>
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={handleRetryWithFormatReminder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry with format reminder</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Image Lightbox Modal */}
    {selectedImage && (
      <div
        onClick={() => setSelectedImage(null)}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs text-slate-300">
            <span className="font-medium truncate max-w-xs">{selectedImage.name || 'Image Preview'}</span>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-950">
            <img
              src={selectedImage.previewUrl || selectedImage.thumbnail || (selectedImage.base64 ? `data:${selectedImage.mimeType || 'image/jpeg'};base64,${selectedImage.base64}` : '')}
              alt={selectedImage.name}
              className="max-h-[70vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    )}
  </>
  );
}

