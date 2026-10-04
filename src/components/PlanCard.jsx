import React, { useState } from 'react';
import {
  ListChecks,
  CheckCircle2,
  FileCode,
  FilePlus,
  Edit3,
  HelpCircle,
  Play,
  RotateCw,
  FastForward,
  MessageSquarePlus,
  Check,
  X,
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

export default function PlanCard({ message }) {
  const { plan, planStatus = 'pending', originalPrompt, originalImages, id: messageId } = message;
  const approvePlan = useChatStore((state) => state.approvePlan);
  const regeneratePlan = useChatStore((state) => state.regeneratePlan);
  const skipPlan = useChatStore((state) => state.skipPlan);
  const isStreaming = useChatStore((state) => state.isStreaming);

  const initialFiles = plan?.files || [];
  const initialSteps = plan?.steps || [];
  const initialQuestions = plan?.questions || [];

  // Local state for interactive editing before approval
  const [selectedFiles, setSelectedFiles] = useState(
    () => initialFiles.map((f) => f.path)
  );
  const [editedSteps, setEditedSteps] = useState(() => [...initialSteps]);
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [editingStepText, setEditingStepText] = useState('');

  const [answers, setAnswers] = useState({});
  const [userNote, setUserNote] = useState('');

  if (!plan && planStatus !== 'unparsed') {
    return null;
  }

  const isApproved = planStatus === 'approved';
  const isSkipped = planStatus === 'skipped';
  const isPending = planStatus === 'pending' || planStatus === 'unparsed';

  const toggleFile = (path) => {
    if (!isPending) return;
    setSelectedFiles((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleStartEditStep = (idx) => {
    if (!isPending) return;
    setEditingStepIndex(idx);
    setEditingStepText(editedSteps[idx] || '');
  };

  const handleSaveEditStep = (idx) => {
    if (editingStepText.trim()) {
      const updated = [...editedSteps];
      updated[idx] = editingStepText.trim();
      setEditedSteps(updated);
    }
    setEditingStepIndex(null);
  };

  const handleApprove = () => {
    if (isStreaming) return;
    const modifiedPlan = {
      ...plan,
      steps: editedSteps,
    };
    approvePlan(messageId, {
      plan: modifiedPlan,
      selectedFiles,
      userNote,
      answers,
    });
  };

  const handleRegenerate = () => {
    if (isStreaming) return;
    regeneratePlan(messageId, { userNote });
  };

  const handleSkip = () => {
    if (isStreaming) return;
    skipPlan(messageId);
  };

  return (
    <div
      className={`my-3 rounded-xl border transition-all overflow-hidden ${
        isApproved
          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-xs'
          : isSkipped
          ? 'bg-slate-900/40 border-slate-800 opacity-75'
          : 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b ${
          isApproved
            ? 'bg-emerald-950/40 border-emerald-500/20'
            : isSkipped
            ? 'bg-slate-800/40 border-slate-800'
            : 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/20'
        }`}
      >
        <div className="flex items-center gap-2">
          <ListChecks
            className={`w-4 h-4 ${
              isApproved ? 'text-emerald-400' : isSkipped ? 'text-slate-400' : 'text-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-xs font-semibold text-slate-200">
            Implementation Plan
          </span>
        </div>

        {/* Status Badge */}
        <div>
          {isApproved && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Approved
            </span>
          )}
          {isSkipped && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-medium">
              Skipped
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-medium">
              Awaiting Approval
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3.5 text-xs">
        {/* Summary */}
        {plan?.summary && (
          <div className="text-slate-200 leading-relaxed font-medium bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold mb-0.5">
              Goal & Summary
            </span>
            {plan.summary}
          </div>
        )}

        {/* File Checklist */}
        {initialFiles.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Files to change / create ({selectedFiles.length} of {initialFiles.length} selected)</span>
            </div>
            <div className="space-y-1.5">
              {initialFiles.map((f) => {
                const isSelected = selectedFiles.includes(f.path);
                const isNew = f.kind === 'new';

                return (
                  <label
                    key={f.path}
                    className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${
                      isPending ? 'cursor-pointer hover:bg-slate-800/60' : 'cursor-default'
                    } ${
                      isSelected
                        ? 'bg-slate-800/50 border-emerald-500/30 text-slate-200'
                        : 'bg-slate-900/30 border-slate-800 text-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isPending}
                      onChange={() => toggleFile(f.path)}
                      className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-default"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-medium text-[11px] text-slate-200">
                          {f.path}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isNew
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {isNew ? 'new' : 'edit'}
                        </span>
                      </div>
                      {f.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {f.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Steps */}
        {editedSteps.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Implementation Steps
            </div>
            <div className="space-y-1.5">
              {editedSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-slate-950/30 p-2 rounded-lg border border-slate-800/70 text-slate-300 group"
                >
                  <span className="text-[11px] font-mono text-emerald-400 font-bold shrink-0 mt-0.5">
                    {idx + 1}.
                  </span>
                  {editingStepIndex === idx && isPending ? (
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingStepText}
                        onChange={(e) => setEditingStepText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditStep(idx);
                          if (e.key === 'Escape') setEditingStepIndex(null);
                        }}
                        autoFocus
                        className="flex-1 bg-slate-900 border border-emerald-500/50 rounded px-2 py-0.5 text-xs text-slate-200 outline-none"
                      />
                      <button
                        onClick={() => handleSaveEditStep(idx)}
                        className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        title="Save step"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingStepIndex(null)}
                        className="p-1 text-slate-400 hover:text-slate-300 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="text-slate-300 text-[11px]">{step}</span>
                      {isPending && (
                        <button
                          onClick={() => handleStartEditStep(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 p-0.5 transition-opacity cursor-pointer"
                          title="Edit step"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions (if any) */}
        {initialQuestions.length > 0 && (
          <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-[11px]">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Questions / Clarifications:</span>
            </div>
            {initialQuestions.map((q, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-slate-300 text-[11px] font-medium">{q}</p>
                {isPending ? (
                  <input
                    type="text"
                    placeholder="Your answer (optional)..."
                    value={answers[q] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                    className="w-full bg-slate-900/90 border border-indigo-500/30 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-400"
                  />
                ) : (
                  answers[q] && (
                    <p className="text-[11px] text-indigo-200 bg-indigo-950/40 px-2 py-0.5 rounded">
                      Ans: {answers[q]}
                    </p>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {/* Custom User Note */}
        {isPending && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Additional Instructions / Custom Note (optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 'Use blue primary color', 'Keep the layout compact'..."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>
        )}

        {/* Display saved note if approved */}
        {isApproved && message.planUserNote && (
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
            <span className="text-slate-400 font-semibold block">User note:</span>
            {message.planUserNote}
          </div>
        )}

        {/* Action Buttons for Pending Plan */}
        {isPending && (
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isStreaming}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 cursor-pointer transition-colors disabled:opacity-50"
              >
                <RotateCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={isStreaming}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 cursor-pointer transition-colors disabled:opacity-50"
                title="Build immediately without this plan"
              >
                <FastForward className="w-3 h-3 text-slate-400" />
                <span>Skip planning</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isStreaming || selectedFiles.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Approve and build</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
