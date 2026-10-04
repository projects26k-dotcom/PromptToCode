import React from 'react';
import { ListChecks } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

export default function PlanToggle() {
  const { planMode, setPlanMode } = useSettingsStore();

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 select-none transition-all shadow-xs"
      title="The AI shows a plan for you to approve before writing code."
    >
      <button
        type="button"
        onClick={() => setPlanMode(!planMode)}
        className="flex items-center gap-1.5 text-xs cursor-pointer group"
      >
        <ListChecks
          className={`w-3.5 h-3.5 transition-colors ${
            planMode ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        />
        <span
          className={`font-medium text-[11px] transition-colors ${
            planMode ? 'text-emerald-300 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          Plan first
        </span>
        <div
          className={`w-6 h-3.5 rounded-full transition-colors relative flex items-center p-0.5 ${
            planMode ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
              planMode ? 'translate-x-2.5' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    </div>
  );
}
