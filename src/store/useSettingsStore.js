import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_MODEL = 'gemini-3.8-flash';

export const MODEL_GROUPS = [
  {
    group: 'TEXT / MULTIMODAL',
    models: [
      { id: 'gemini-3.8-flash', name: 'gemini-3.8-flash (Recommended)' },
      { id: 'gemini-3.7-flash', name: 'gemini-3.7-flash' },
      { id: 'gemini-3.6-flash', name: 'gemini-3.6-flash' },
      { id: 'gemini-3.5-flash', name: 'gemini-3.5-flash' },
      { id: 'gemini-3.5-flash-lite', name: 'gemini-3.5-flash-lite' },
      { id: 'gemini-3.1-flash-lite', name: 'gemini-3.1-flash-lite' },
      { id: 'gemini-3-flash-preview', name: 'gemini-3-flash-preview (legacy)' },
      { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash' },
    ],
  },
  {
    group: 'LIVE / SPEECH',
    models: [
      { id: 'gemini-3.8-live', name: 'gemini-3.8-live' },
      { id: 'gemini-3.8-live-extended-thinking', name: 'gemini-3.8-live-extended-thinking' },
      { id: 'gemini-3.1-flash-live-preview', name: 'gemini-3.1-flash-live-preview' },
      { id: 'gemini-3.5-live-translate-preview', name: 'gemini-3.5-live-translate-preview' },
      { id: 'gemini-3.5-transcribe', name: 'gemini-3.5-transcribe' },
      { id: 'gemini-3.5-transcribe-live', name: 'gemini-3.5-transcribe-live' },
      { id: 'gemini-3.8-flash-tts', name: 'gemini-3.8-flash-tts' },
      { id: 'gemini-3.8-flash-lite-tts', name: 'gemini-3.8-flash-lite-tts' },
      { id: 'gemini-3.1-flash-tts-preview', name: 'gemini-3.1-flash-tts-preview' },
    ],
  },
];

const validModelIds = new Set(
  MODEL_GROUPS.flatMap((g) => g.models.map((m) => m.id))
);

export const useSettingsStore = create(
  persist(
    (set) => ({
      settingsVersion: 2,
      geminiKey: '',
      selectedModel: DEFAULT_MODEL,
      viewMode: 'split', // 'code' | 'split' | 'preview'
      autoApply: false, // Default: false (diff-first mode)
      autoFix: false, // Default: false (Fix with AI automated triggers)
      autoImages: true, // Default: true (generate contextual dynamic images via Pollinations AI)
      learnMode: false, // Default: false (Learn Mode explanations and quizzes)
      learnLevel: 'beginner', // 'beginner' | 'intermediate' (default: beginner)
      planMode: false, // Default: false (Plan first before writing code)
      maxFixAttempts: 3, // Default: 3 attempts before escalating to full context
      reactRunnerMode: 'builtin', // 'builtin' | 'sandpack' (default: builtin)
      previewRunner: 'builtin',
      isSettingsOpen: false,
      isSidebarCollapsed: false,
      theme: 'dark', // 'dark' | 'light'

      setGeminiKey: (geminiKey) => set({ geminiKey: geminiKey.trim() }),
      setModel: (selectedModel) =>
        set({
          selectedModel: validModelIds.has(selectedModel)
            ? selectedModel
            : DEFAULT_MODEL,
        }),
      setViewMode: (viewMode) => set({ viewMode }),
      setAutoApply: (autoApply) => set({ autoApply }),
      setAutoFix: (autoFix) => set({ autoFix }),
      setAutoImages: (autoImages) => set({ autoImages }),
      setLearnMode: (learnMode) => set({ learnMode }),
      setLearnLevel: (learnLevel) => set({ learnLevel }),
      setPlanMode: (planMode) => set({ planMode }),
      setMaxFixAttempts: (maxFixAttempts) => set({ maxFixAttempts }),
      setReactRunnerMode: (mode) => set({ reactRunnerMode: mode, previewRunner: mode }),
      setPreviewRunner: (mode) => set({ reactRunnerMode: mode, previewRunner: mode }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      toggleSettings: () =>
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'prompttocode-settings',
      version: 2,
      migrate: (persistedState, version) => {
        if (!version || version < 2) {
          return {
            ...persistedState,
            settingsVersion: 2,
            reactRunnerMode: 'builtin',
            previewRunner: 'builtin',
            autoFix: false,
            autoImages: true,
            learnMode: false,
            learnLevel: 'beginner',
            planMode: false,
            maxFixAttempts: 3,
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.settingsVersion || state.settingsVersion < 2) {
            state.settingsVersion = 2;
            state.reactRunnerMode = 'builtin';
            state.previewRunner = 'builtin';
          }
          if (!state.selectedModel || !validModelIds.has(state.selectedModel)) {
            state.selectedModel = DEFAULT_MODEL;
          }
          if (!['code', 'split', 'preview'].includes(state.viewMode)) {
            state.viewMode = 'split';
          }
          if (typeof state.autoApply !== 'boolean') {
            state.autoApply = false;
          }
          if (typeof state.autoFix !== 'boolean') {
            state.autoFix = false;
          }
          if (typeof state.autoImages !== 'boolean') {
            state.autoImages = true;
          }
          if (typeof state.learnMode !== 'boolean') {
            state.learnMode = false;
          }
          if (!['beginner', 'intermediate'].includes(state.learnLevel)) {
            state.learnLevel = 'beginner';
          }
          if (typeof state.planMode !== 'boolean') {
            state.planMode = false;
          }
          if (typeof state.maxFixAttempts !== 'number') {
            state.maxFixAttempts = 3;
          }
          if (!['builtin', 'sandpack'].includes(state.reactRunnerMode)) {
            state.reactRunnerMode = 'builtin';
            state.previewRunner = 'builtin';
          }
        }
      },
      partialize: (state) => ({
        settingsVersion: state.settingsVersion || 2,
        geminiKey: state.geminiKey,
        selectedModel: validModelIds.has(state.selectedModel)
          ? state.selectedModel
          : DEFAULT_MODEL,
        viewMode: state.viewMode || 'split',
        autoApply: state.autoApply || false,
        autoFix: state.autoFix || false,
        autoImages: typeof state.autoImages === 'boolean' ? state.autoImages : true,
        learnMode: state.learnMode || false,
        learnLevel: state.learnLevel || 'beginner',
        planMode: state.planMode || false,
        maxFixAttempts: state.maxFixAttempts || 3,
        reactRunnerMode: state.reactRunnerMode || 'builtin',
        previewRunner: state.reactRunnerMode || 'builtin',
        theme: state.theme || 'dark',
      }),
    }
  )
);
