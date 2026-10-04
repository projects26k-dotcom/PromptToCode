import React from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

export default function LearnToggle() {
  const { learnMode, learnLevel, setLearnMode, setLearnLevel } = useSettingsStore();

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 select-none transition-all shadow-xs"
      title="The AI explains what it builds so you can learn."
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setLearnMode(!learnMode)}
        className="flex items-center gap-1.5 text-xs cursor-pointer group"
      >
        <GraduationCap
          className={`w-3.5 h-3.5 transition-colors ${
            learnMode ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        />
        <span
          className={`font-medium text-[11px] transition-colors ${
            learnMode ? 'text-amber-300 font-semibold' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          Learn
        </span>
        <div
          className={`w-6 h-3.5 rounded-full transition-colors relative flex items-center p-0.5 ${
            learnMode ? 'bg-amber-500' : 'bg-slate-700'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
              learnMode ? 'translate-x-2.5' : 'translate-x-0'
            }`}
          />
        </div>
      </button>

      {/* Level Dropdown (Visible only when learnMode is ON) */}
      {learnMode && (
        <select
          value={learnLevel}
          onChange={(e) => setLearnLevel(e.target.value)}
          className="bg-slate-900 border border-amber-500/40 text-amber-300 text-[10px] rounded px-1 py-0.5 outline-none cursor-pointer capitalize font-medium animate-in fade-in duration-150"
          title="Select explanation depth"
        >
          <option value="beginner" className="bg-slate-900 text-slate-200">
            Beginner
          </option>
          <option value="intermediate" className="bg-slate-900 text-slate-200">
            Intermediate
          </option>
        </select>
      )}
    </div>
  );
}
