import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileCode, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

export default function ExplanationCard({ explanation, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { openFile } = useProjectStore();

  if (!explanation) return null;

  const { path, purpose, keyParts = [], concept } = explanation;

  return (
    <div className="w-full rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden shadow-xs">
      {/* Card Header (Click to expand/collapse) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-850 text-left transition-colors cursor-pointer select-none gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-mono text-xs font-semibold text-slate-200 truncate">
            {path}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/50 font-sans font-medium shrink-0">
            Explanation
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            {isExpanded ? 'Collapse' : 'Details'}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Card Content Body */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 text-xs leading-relaxed border-t border-slate-800/80 animate-in fade-in duration-150">
          {/* Purpose */}
          {purpose && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Purpose
              </span>
              <p className="text-slate-200 font-medium">{purpose}</p>
            </div>
          )}

          {/* Key Parts */}
          {keyParts && keyParts.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Key Parts
              </span>
              <ul className="space-y-1 pl-1">
                {keyParts.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 mt-1.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concept Box */}
          {concept && (
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-amber-950/40 to-indigo-950/40 border border-amber-500/30 flex items-start gap-2.5 text-amber-200">
              <div className="p-1 rounded-md bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300/90 block mb-0.5">
                  Core Concept
                </span>
                <p className="text-[11px] text-amber-100/90 leading-relaxed font-normal">
                  {concept}
                </p>
              </div>
            </div>
          )}

          {/* Jump to File Button */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => openFile(path)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Open {path} in Editor →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
