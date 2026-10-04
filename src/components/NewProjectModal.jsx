import React, { useState, useEffect } from 'react';
import {
  X,
  FileCode,
  LayoutTemplate,
  CheckSquare,
  Sparkles,
  FolderPlus,
  Atom,
  Globe
} from 'lucide-react';
import { useProjectsStore } from '../store/useProjectsStore';
import { TEMPLATES } from '../lib/templates';

function getTemplateIcon(iconName) {
  switch (iconName) {
    case 'LayoutTemplate':
      return <LayoutTemplate className="w-5 h-5 text-purple-400" />;
    case 'CheckSquare':
      return <CheckSquare className="w-5 h-5 text-emerald-400" />;
    case 'Atom':
      return <Atom className="w-5 h-5 text-sky-400" />;
    default:
      return <FileCode className="w-5 h-5 text-indigo-400" />;
  }
}

export default function NewProjectModal() {
  const { isNewProjectModalOpen, closeNewProjectModal, createProject } = useProjectsStore();

  const [projectType, setProjectType] = useState('vanilla'); // 'vanilla' | 'react'
  const [projectName, setProjectName] = useState('My Vibe Project');
  const [selectedTemplate, setSelectedTemplate] = useState('blank-vanilla');

  useEffect(() => {
    if (isNewProjectModalOpen) {
      setProjectType('vanilla');
      setProjectName(`Project ${Math.floor(Math.random() * 900 + 100)}`);
      setSelectedTemplate('blank-vanilla');
    }
  }, [isNewProjectModalOpen]);

  // When projectType changes, select the first matching template
  const handleTypeChange = (type) => {
    setProjectType(type);
    const firstMatching = TEMPLATES.find((t) => t.type === type);
    if (firstMatching) {
      setSelectedTemplate(firstMatching.id);
    }
  };

  if (!isNewProjectModalOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    createProject(projectName, selectedTemplate);
  };

  const filteredTemplates = TEMPLATES.filter((t) => t.type === projectType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Create New Project</h2>
              <p className="text-[11px] text-slate-400">Choose your project stack and template</p>
            </div>
          </div>
          <button
            onClick={closeNewProjectModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Project Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Project Stack
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('vanilla')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  projectType === 'vanilla'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-xs'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Vanilla HTML/CSS/JS</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('react')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  projectType === 'react'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-xs'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Atom className="w-4 h-4 text-sky-400" />
                <span>React (Sandpack)</span>
              </button>
            </div>
          </div>

          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. My Awesome App"
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-medium text-white placeholder-slate-600 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Select Starter Template
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/80 shadow-xs'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {getTemplateIcon(tpl.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>
                          {tpl.name}
                        </h4>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeNewProjectModal}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
