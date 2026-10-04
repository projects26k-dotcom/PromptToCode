import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

export default function RightPanel() {
  return (
    <div className="h-full w-full bg-slate-900 border-l border-slate-800 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-600/10">
          <Bot className="w-7 h-7 text-purple-400" />
        </div>
        <div className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-1 shadow">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-200 mb-1 tracking-wide">
        AI Assistant
      </h3>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
        AI chat coming in Step 2
      </p>

      <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
        <span>Ready for prompt integration</span>
      </div>
    </div>
  );
}
