import { create } from 'zustand';
import { useProjectStore } from './useProjectStore';
import { useSettingsStore } from './useSettingsStore';
import { usePendingStore } from './usePendingStore';
import { useProjectsStore } from './useProjectsStore';
import { useConsoleStore } from './useConsoleStore';
import { streamGemini } from '../lib/ai/gemini';
import { buildSystemPrompt } from '../lib/ai/systemPrompt';
import { buildFixPrompt } from '../lib/ai/fixPrompt';
import { buildPlanSystemPrompt, buildApprovedPlanPrompt, shouldSkipPlanning } from '../lib/ai/planPrompt';
import { parseFiles, parseExplanations, parsePlan } from '../lib/ai/parseResponse';
import { prepareImage } from '../lib/ai/imageUtils';

let currentAbortController = null;

export const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  error: null,
  promptConfirmation: null, // { prompt: string, detectedType: 'react' | 'vanilla', message: string }
  pendingImages: [], // Array of prepared image objects { id, name, size, mimeType, base64, thumbnail, previewUrl, width, height }
  isProcessingImage: false,

  // Load chat messages when opening a project
  loadChatMessages: (messages) => {
    set({
      messages: messages || [],
      isStreaming: false,
      error: null,
      promptConfirmation: null,
      pendingImages: [],
      isProcessingImage: false,
    });
  },

  // Attach images (file picker, drag & drop, paste)
  attachImages: async (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const currentPending = get().pendingImages;

    if (currentPending.length >= 3) {
      get().addSystemNotice('Maximum 3 images per message.', 'warning');
      return;
    }

    const availableSlots = 3 - currentPending.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    if (fileArray.length > availableSlots) {
      get().addSystemNotice(
        `Only ${availableSlots} more image${availableSlots > 1 ? 's' : ''} allowed (max 3 per message).`,
        'warning'
      );
    }

    set({ isProcessingImage: true });

    try {
      const preparedList = [];
      for (const file of filesToProcess) {
        try {
          const prepared = await prepareImage(file);
          preparedList.push(prepared);
        } catch (err) {
          get().addSystemNotice(err.message || 'Failed to process image.', 'error');
        }
      }

      if (preparedList.length > 0) {
        set((state) => ({
          pendingImages: [...state.pendingImages, ...preparedList].slice(0, 3),
        }));
      }
    } finally {
      set({ isProcessingImage: false });
    }
  },

  removeAttachedImage: (id) => {
    set((state) => ({
      pendingImages: state.pendingImages.filter((img) => img.id !== id),
    }));
  },

  clearAttachedImages: () => {
    set({ pendingImages: [] });
  },

  // Main send message entry point with smart framework detection
  sendMessage: async (prompt, bypassDetection = false) => {
    const { pendingImages, isStreaming } = get();
    let cleanPrompt = prompt?.trim() || '';

    // If image attached without text, use default prompt and bypass React detector
    let isDefaultPrompt = false;
    if (!cleanPrompt && pendingImages.length > 0) {
      cleanPrompt = 'Recreate this design as closely as possible.';
      isDefaultPrompt = true;
      bypassDetection = true;
    }

    if (!cleanPrompt || isStreaming) return;

    if (!bypassDetection && !isDefaultPrompt) {
      const currentType = useProjectsStore.getState().currentProjectType || 'vanilla';

      // 1. React keywords in Vanilla project
      if (
        currentType === 'vanilla' &&
        /\b(react|jsx|hooks|useState|useEffect)\b/i.test(cleanPrompt)
      ) {
        set({
          promptConfirmation: {
            prompt: cleanPrompt,
            detectedType: 'react',
            message: 'This looks like a React request. Create a new React project for it?',
          },
        });
        return;
      }

      // 2. Vanilla phrases in React project
      if (
        currentType === 'react' &&
        /\b(plain html|vanilla js|vanilla html|vanilla javascript)\b/i.test(cleanPrompt)
      ) {
        set({
          promptConfirmation: {
            prompt: cleanPrompt,
            detectedType: 'vanilla',
            message: 'This looks like a Vanilla HTML/CSS/JS request. Create a new Vanilla project for it?',
          },
        });
        return;
      }
    }

    const imagesToSend = [...pendingImages];
    get().clearAttachedImages();

    const { planMode } = useSettingsStore.getState();
    const projectFiles = useProjectStore.getState().files;

    if (planMode && !shouldSkipPlanning(cleanPrompt, projectFiles)) {
      await get().executePlanMessage(cleanPrompt, imagesToSend);
      return;
    }

    await get().executeSendMessage(cleanPrompt, imagesToSend);
  },

  // Helper to add system notice (e.g. feedback on early exits / pending changes)
  addSystemNotice: (content, noticeType = 'warning', extra = {}) => {
    const noticeMsg = {
      id: 'system-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'system',
      content,
      noticeType, // 'warning' | 'error' | 'info'
      ...extra,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, noticeMsg],
    }));
  },

  // Fix with AI: Sends preview errors directly to Gemini
  sendFixRequest: async (errors, moreContext = false, isAutoFix = false) => {
    const isStreaming = get().isStreaming;
    const pendingChanges = usePendingStore.getState().pending;
    const pendingCount = Object.keys(pendingChanges).length;

    // Resolve errors fresh at execution time
    let rawErrors = errors;
    if (!rawErrors) {
      const latest = useConsoleStore.getState().latestError;
      rawErrors = latest ? [latest] : useConsoleStore.getState().getRecentErrors(3);
    }
    const errorList = (Array.isArray(rawErrors) ? rawErrors : [rawErrors]).filter(Boolean);
    const firstErr = errorList[0];
    const attempts = firstErr?.signature
      ? useConsoleStore.getState().getFixAttempts(firstErr.signature)
      : 0;

    // Dev only diagnostic log
    if (import.meta.env?.DEV) {
      console.log('[fix] clicked', {
        isStreaming,
        pendingCount,
        attempts,
        errors: errorList,
      });
    }

    // 1. Already streaming check
    if (isStreaming) {
      if (import.meta.env?.DEV) {
        console.log('[fix] early return: AI is still busy (isStreaming: true)');
      }
      get().addSystemNotice('The AI is still busy. Click Stop or wait.', 'warning');
      return;
    }

    // 2. Pending changes exist check
    if (pendingCount > 0) {
      if (import.meta.env?.DEV) {
        console.log(`[fix] early return: Pending changes exist (${pendingCount})`);
      }
      get().addSystemNotice('Review or reject pending changes first.', 'warning', {
        action: 'review',
      });
      return;
    }

    // 3. No error details check
    if (errorList.length === 0) {
      if (import.meta.env?.DEV) {
        console.log('[fix] early return: No error details available');
      }
      get().addSystemNotice('No error details available.', 'warning');
      return;
    }

    // Filter out generic "Script error." with no details if better errors exist
    const fixableErrors = errorList.filter(
      (err) => err.message && err.message !== 'Script error.'
    );
    const targetErrors = fixableErrors.length > 0 ? fixableErrors : errorList;

    if (targetErrors.length === 0 || !targetErrors[0]?.message) {
      if (import.meta.env?.DEV) {
        console.log('[fix] early return: Target errors empty or missing message');
      }
      get().addSystemNotice('No error details available.', 'warning');
      return;
    }

    // 4. API Key check
    const { geminiKey, selectedModel, autoApply, openSettings } =
      useSettingsStore.getState();

    if (!geminiKey) {
      if (import.meta.env?.DEV) {
        console.log('[fix] early return: Missing Gemini API key');
      }
      get().addSystemNotice(
        'Gemini API key is required. Please set your key in Settings.',
        'error',
        { action: 'settings' }
      );
      openSettings();
      return;
    }

    // 5. Attempt limit for automated auto-fix (manual clicks bypass this)
    if (isAutoFix && attempts >= 2 && !moreContext) {
      if (import.meta.env?.DEV) {
        console.log('[fix] early return: Max auto-fix attempts reached for this error');
      }
      get().addSystemNotice('Max attempts reached for this error.', 'warning', {
        action: 'retryWithContext',
        actionErrors: targetErrors,
      });
      return;
    }

    set({ error: null });

    // Increment fix attempts for these error signatures
    const consoleStore = useConsoleStore.getState();
    targetErrors.forEach((err) => {
      if (err.signature) {
        consoleStore.incrementFixAttempt(err.signature);
      }
    });

    const projectState = useProjectStore.getState();
    const projectType = useProjectsStore.getState().currentProjectType || 'vanilla';

    // Accepted files only
    const promptText = buildFixPrompt({
      errors: targetErrors,
      files: projectState.files,
      projectType,
      moreContext,
    });

    const rawMsg = firstErr?.message || 'preview error';
    const cleanFirstMsg = rawMsg.replace(/[\r\n]+/g, ' ').slice(0, 80);
    const displayLabel = `Fix: ${cleanFirstMsg}${rawMsg.length > 80 ? '...' : ''}`;

    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'asst-' + (Date.now() + 1);

    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: promptText, // Full prompt for model
      displayContent: displayLabel, // Short label for chat UI
      isAutoFix: true,
      status: 'complete',
    };

    const assistantPlaceholder = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      appliedFiles: [],
      userPrompt: promptText,
      status: 'streaming',
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantPlaceholder],
      isStreaming: true,
    }));

    currentAbortController = new AbortController();

    const systemPrompt = buildSystemPrompt({
      files: projectState.files,
      activeFile: projectState.activeFile,
      projectType,
    });

    const conversationHistory = get()
      .messages.filter((m) => m.id !== assistantMsgId && m.status !== 'error')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    let accumulatedText = '';

    try {
      const stream = streamGemini({
        apiKey: geminiKey,
        model: selectedModel,
        systemPrompt,
        messages: conversationHistory,
        signal: currentAbortController.signal,
      });

      for await (const chunk of stream) {
        accumulatedText += chunk;

        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
          ),
        }));
      }

      let finalFiles = parseFiles(accumulatedText);

      // In React projects, protect root Sandpack structure if bare index.html was proposed
      if (projectType === 'react') {
        const hasBadIndexHtml = finalFiles.some((f) => f.path === 'index.html');
        if (hasBadIndexHtml) {
          finalFiles = finalFiles.filter((f) => f.path !== 'index.html');
          accumulatedText += '\n\n*(Note: Ignored plain index.html to protect React Sandpack root structure)*';
        }
      }

      const isNoChangeNeeded = /NO_CHANGE_NEEDED/i.test(accumulatedText);

      // Check if proposed files are identical to existing files or empty
      const existingFiles = projectState.files;
      const meaningfulFiles = finalFiles.filter(
        (f) => existingFiles[f.path] !== f.content
      );

      if (isNoChangeNeeded || meaningfulFiles.length === 0) {
        const note = isNoChangeNeeded
          ? 'The AI found no problem in your code. This may be a preview problem.'
          : 'The AI could not find a fix. Try describing what you expected.';
        accumulatedText += (accumulatedText ? '\n\n' : '') + note;
      } else {
        // Record signatures for future recurrence tracking upon user acceptance
        targetErrors.forEach((err) => {
          if (err.signature) {
            useConsoleStore.getState().recordFixAccepted(err.signature);
          }
        });

        usePendingStore.getState().setPending(meaningfulFiles, assistantMsgId);

        if (autoApply) {
          usePendingStore.getState().acceptAll();
        }
      }

      const fileList = meaningfulFiles.map((f) => ({ path: f.path }));

      set((state) => ({
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: accumulatedText,
                appliedFiles: fileList,
                status: 'complete',
              }
            : m
        ),
      }));

      try {
        useProjectsStore.getState().scheduleAutoSave();
      } catch {}
    } catch (err) {
      if (err.name === 'AbortError' || currentAbortController?.signal.aborted) {
        let finalFiles = parseFiles(accumulatedText);
        if (projectType === 'react') {
          finalFiles = finalFiles.filter((f) => f.path !== 'index.html');
        }
        const fileList = finalFiles.map((f) => ({ path: f.path }));

        if (finalFiles.length > 0) {
          usePendingStore.getState().setPending(finalFiles, assistantMsgId);
          if (autoApply) {
            usePendingStore.getState().acceptAll();
          }
        }

        set((state) => ({
          isStreaming: false,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedText,
                  appliedFiles: fileList,
                  status: 'complete',
                }
              : m
          ),
        }));

        try {
          useProjectsStore.getState().scheduleAutoSave();
        } catch {}
      } else {
        const errorMsg = err.message || 'Failed to stream response from Gemini API';
        set((state) => ({
          isStreaming: false,
          error: errorMsg,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedText
                    ? `${accumulatedText}\n\n⚠️ ${errorMsg}`
                    : `⚠️ ${errorMsg}`,
                  status: 'error',
                  error: errorMsg,
                }
              : m
          ),
        }));
      }
    } finally {
      currentAbortController = null;
      set({ isStreaming: false });
    }
  },

  // Retry with format reminder when AI generated raw code blocks without file tags
  retryWithFormatReminder: (originalPrompt) => {
    const reminder = `${originalPrompt}\n\nReturn each file ONLY as \`\`\`file:path blocks with full content. Do not put code anywhere else.`;
    get().sendMessage(reminder, true);
  },

  // Confirm and proceed from smart detection modal
  confirmPromptType: async (action) => {
    const { promptConfirmation } = get();
    if (!promptConfirmation) return;

    const { prompt, detectedType } = promptConfirmation;
    set({ promptConfirmation: null });

    if (action === 'switch') {
      const templateId = detectedType === 'react' ? 'blank-react' : 'blank-vanilla';
      const projectName = detectedType === 'react' ? 'My React App' : 'My Vanilla App';
      await useProjectsStore.getState().createProject(projectName, templateId);
    }

    setTimeout(() => {
      get().executeSendMessage(prompt);
    }, 100);
  },

  cancelPromptConfirmation: () => {
    set({ promptConfirmation: null });
  },

  executeSendMessage: async (cleanPrompt, attachedImages = [], options = {}) => {
    const { geminiKey, selectedModel, autoApply, openSettings } =
      useSettingsStore.getState();

    if (!geminiKey) {
      set({
        error: 'Gemini API key is required. Please set your key in Settings.',
      });
      openSettings();
      return;
    }

    set({ error: null });

    // Mark any earlier pending plans as skipped
    set((state) => ({
      messages: state.messages.map((m) =>
        m.planStatus === 'pending' ? { ...m, planStatus: 'skipped' } : m
      ),
    }));

    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'asst-' + (Date.now() + 1);

    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: cleanPrompt,
      displayContent: options.displayContent || undefined,
      images: attachedImages && attachedImages.length > 0
        ? attachedImages.map((img) => ({
            id: img.id,
            name: img.name,
            size: img.size,
            mimeType: img.mimeType,
            base64: img.base64,
            thumbnail: img.thumbnail,
            previewUrl: img.previewUrl,
            width: img.width,
            height: img.height,
          }))
        : undefined,
      status: 'complete',
    };

    const assistantPlaceholder = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      appliedFiles: [],
      userPrompt: cleanPrompt, // Store original prompt for format retries
      status: 'streaming',
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantPlaceholder],
      isStreaming: true,
    }));

    currentAbortController = new AbortController();

    const projectState = useProjectStore.getState();
    const projectType = useProjectsStore.getState().currentProjectType || 'vanilla';
    const settings = useSettingsStore.getState();
    const autoImages = settings.autoImages ?? true;
    const learnMode = settings.learnMode ?? false;
    const learnLevel = settings.learnLevel || 'beginner';

    const systemPrompt = buildSystemPrompt({
      files: projectState.files,
      activeFile: projectState.activeFile,
      projectType,
      hasImages: attachedImages && attachedImages.length > 0,
      autoImages,
      learnMode,
      learnLevel,
    });

    // Verification logging in dev mode
    if (import.meta.env.DEV) {
      console.log(`[VibeForge AI System Prompt (${projectType})]:\n`, systemPrompt.slice(0, 200));
    }

    const conversationHistory = get()
      .messages.filter((m) => m.id !== assistantMsgId && m.status !== 'error')
      .map((m) => ({
        role: m.role,
        content: m.content,
        images: m.images,
      }));

    let accumulatedText = '';

    try {
      const stream = streamGemini({
        apiKey: geminiKey,
        model: selectedModel,
        systemPrompt,
        messages: conversationHistory,
        signal: currentAbortController.signal,
      });

      for await (const chunk of stream) {
        accumulatedText += chunk;

        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
          ),
        }));
      }

      let finalFiles = parseFiles(accumulatedText);
      const parsedExplanations = parseExplanations(accumulatedText);

      // In React projects, protect root Sandpack structure if bare index.html was proposed
      if (projectType === 'react') {
        const hasBadIndexHtml = finalFiles.some((f) => f.path === 'index.html');
        if (hasBadIndexHtml) {
          finalFiles = finalFiles.filter((f) => f.path !== 'index.html');
          accumulatedText += '\n\n*(Note: Ignored plain index.html to protect React Sandpack root structure)*';
        }
      }

      const fileList = finalFiles.map((f) => ({ path: f.path }));

      if (finalFiles.length > 0) {
        usePendingStore.getState().setPending(finalFiles, assistantMsgId);

        if (autoApply) {
          usePendingStore.getState().acceptAll();
        }
      }

      set((state) => ({
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: accumulatedText,
                appliedFiles: fileList,
                explanations: parsedExplanations.length > 0 ? parsedExplanations : undefined,
                status: 'complete',
              }
            : m
        ),
      }));

      try {
        useProjectsStore.getState().scheduleAutoSave();
      } catch {}
    } catch (err) {
      if (err.name === 'AbortError' || currentAbortController?.signal.aborted) {
        let finalFiles = parseFiles(accumulatedText);
        const parsedExplanations = parseExplanations(accumulatedText);
        if (projectType === 'react') {
          finalFiles = finalFiles.filter((f) => f.path !== 'index.html');
        }
        const fileList = finalFiles.map((f) => ({ path: f.path }));

        if (finalFiles.length > 0) {
          usePendingStore.getState().setPending(finalFiles, assistantMsgId);
          if (autoApply) {
            usePendingStore.getState().acceptAll();
          }
        }

        set((state) => ({
          isStreaming: false,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedText,
                  appliedFiles: fileList,
                  explanations: parsedExplanations.length > 0 ? parsedExplanations : undefined,
                  status: 'complete',
                }
              : m
          ),
        }));

        try {
          useProjectsStore.getState().scheduleAutoSave();
        } catch {}
      } else {
        const errorMsg = err.message || 'Failed to stream response from Gemini API';
        set((state) => ({
          isStreaming: false,
          error: errorMsg,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedText
                    ? `${accumulatedText}\n\n⚠️ ${errorMsg}`
                    : `⚠️ ${errorMsg}`,
                  status: 'error',
                  error: errorMsg,
                }
              : m
          ),
        }));
      }
    } finally {
      currentAbortController = null;
      set({ isStreaming: false });
    }
  },

  // Plan Mode Phase 1: Request plan before writing code
  executePlanMessage: async (cleanPrompt, attachedImages = []) => {
    const { geminiKey, selectedModel, openSettings } = useSettingsStore.getState();

    if (!geminiKey) {
      set({
        error: 'Gemini API key is required. Please set your key in Settings.',
      });
      openSettings();
      return;
    }

    set({ error: null });

    // Mark any previous pending plans as skipped
    set((state) => ({
      messages: state.messages.map((m) =>
        m.planStatus === 'pending' ? { ...m, planStatus: 'skipped' } : m
      ),
    }));

    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'asst-' + (Date.now() + 1);

    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: cleanPrompt,
      images: attachedImages && attachedImages.length > 0
        ? attachedImages.map((img) => ({
            id: img.id,
            name: img.name,
            size: img.size,
            mimeType: img.mimeType,
            base64: img.base64,
            thumbnail: img.thumbnail,
            previewUrl: img.previewUrl,
            width: img.width,
            height: img.height,
          }))
        : undefined,
      status: 'complete',
    };

    const assistantPlaceholder = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      appliedFiles: [],
      userPrompt: cleanPrompt,
      originalPrompt: cleanPrompt,
      originalImages: attachedImages,
      planStatus: 'pending',
      status: 'streaming',
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantPlaceholder],
      isStreaming: true,
    }));

    currentAbortController = new AbortController();

    const projectState = useProjectStore.getState();
    const projectType = useProjectsStore.getState().currentProjectType || 'vanilla';

    const systemPrompt = buildPlanSystemPrompt({
      files: projectState.files,
      activeFile: projectState.activeFile,
      projectType,
    });

    const conversationHistory = get()
      .messages.filter((m) => m.id !== assistantMsgId && m.status !== 'error')
      .map((m) => ({
        role: m.role,
        content: m.content,
        images: m.images,
      }));

    let accumulatedText = '';

    try {
      const stream = streamGemini({
        apiKey: geminiKey,
        model: selectedModel,
        systemPrompt,
        messages: conversationHistory,
        signal: currentAbortController.signal,
      });

      for await (const chunk of stream) {
        accumulatedText += chunk;

        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
          ),
        }));
      }

      // Check if AI mistakenly returned code files directly
      const finalFiles = parseFiles(accumulatedText);
      if (finalFiles.length > 0) {
        const fileList = finalFiles.map((f) => ({ path: f.path }));
        usePendingStore.getState().setPending(finalFiles, assistantMsgId);
        const { autoApply } = useSettingsStore.getState();
        if (autoApply) {
          usePendingStore.getState().acceptAll();
        }

        set((state) => ({
          isStreaming: false,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedText,
                  appliedFiles: fileList,
                  planStatus: undefined,
                  plan: undefined,
                  status: 'complete',
                }
              : m
          ),
        }));
      } else {
        const parsedPlan = parsePlan(accumulatedText);
        set((state) => ({
          isStreaming: false,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedText,
                  plan: parsedPlan || undefined,
                  planStatus: parsedPlan ? 'pending' : 'unparsed',
                  originalPrompt: cleanPrompt,
                  originalImages: attachedImages,
                  status: 'complete',
                }
              : m
          ),
        }));
      }

      try {
        useProjectsStore.getState().scheduleAutoSave();
      } catch {}
    } catch (err) {
      if (err.name === 'AbortError' || currentAbortController?.signal.aborted) {
        const parsedPlan = parsePlan(accumulatedText);
        set((state) => ({
          isStreaming: false,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedText,
                  plan: parsedPlan || undefined,
                  planStatus: parsedPlan ? 'pending' : 'unparsed',
                  originalPrompt: cleanPrompt,
                  originalImages: attachedImages,
                  status: 'complete',
                }
              : m
          ),
        }));
      } else {
        const errorMsg = err.message || 'Failed to generate plan';
        set((state) => ({
          isStreaming: false,
          error: errorMsg,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedText
                    ? `${accumulatedText}\n\n⚠️ ${errorMsg}`
                    : `⚠️ ${errorMsg}`,
                  status: 'error',
                  error: errorMsg,
                }
              : m
          ),
        }));
      }
    } finally {
      currentAbortController = null;
      set({ isStreaming: false });
    }
  },

  // Approve plan and initiate Phase 2 (Code Building)
  approvePlan: async (messageId, { plan, selectedFiles, userNote, answers }) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg) return;

    // Update plan status to approved on message
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              plan,
              planStatus: 'approved',
              planSelectedFiles: selectedFiles,
              planUserNote: userNote,
              planAnswers: answers,
            }
          : m
      ),
    }));

    const approvedPrompt = buildApprovedPlanPrompt({
      originalPrompt: msg.originalPrompt || msg.userPrompt || 'Build feature',
      plan,
      selectedFiles,
      userNote,
      answers,
    });

    await get().executeSendMessage(approvedPrompt, msg.originalImages || [], {
      displayContent: 'Building approved plan',
    });
  },

  // Regenerate plan with updated feedback
  regeneratePlan: async (messageId, { userNote } = {}) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg) return;

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, planStatus: 'skipped' } : m
      ),
    }));

    let prompt = msg.originalPrompt || msg.userPrompt || '';
    if (userNote && userNote.trim()) {
      prompt += ` (Updated instructions: ${userNote.trim()})`;
    }

    await get().executePlanMessage(prompt, msg.originalImages || []);
  },

  // Skip plan and build directly
  skipPlan: async (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg) return;

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, planStatus: 'skipped' } : m
      ),
    }));

    await get().executeSendMessage(
      msg.originalPrompt || msg.userPrompt || 'Build project',
      msg.originalImages || []
    );
  },

  // Explain selection with AI (from editor selection)
  sendExplainSelectionRequest: async ({ code, file }) => {
    if (!code || !code.trim() || get().isStreaming) return;
    const settings = useSettingsStore.getState();
    const { geminiKey, selectedModel, learnLevel, openSettings } = settings;

    if (!geminiKey) {
      get().addSystemNotice('Gemini API key is required. Please configure it in Settings.', 'error', {
        action: 'settings',
      });
      openSettings();
      return;
    }

    const cleanCode = code.trim();
    const userPrompt = `Explain this code from ${file || 'the editor'} step by step for a ${learnLevel} coder:\n\n\`\`\`\n${cleanCode}\n\`\`\``;
    const userDisplay = `Explain selection (${file || 'editor'})`;

    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'asst-' + (Date.now() + 1);

    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: userPrompt,
      displayContent: userDisplay,
      status: 'complete',
    };

    const assistantPlaceholder = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      appliedFiles: [],
      status: 'streaming',
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantPlaceholder],
      isStreaming: true,
    }));

    currentAbortController = new AbortController();

    const systemPrompt = `You are a friendly, encouraging coding tutor.
The user is learning to code (${learnLevel} level).
Explain the provided code snippet clearly step by step, defining any technical terms, and explaining why it was written this way.
CRITICAL: Do NOT return any \`\`\`file: blocks or proposed file edits. Provide ONLY a well-formatted markdown explanation.`;

    let accumulatedText = '';

    try {
      const stream = streamGemini({
        apiKey: geminiKey,
        model: selectedModel,
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        signal: currentAbortController.signal,
      });

      for await (const chunk of stream) {
        accumulatedText += chunk;
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
          ),
        }));
      }

      set((state) => ({
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: accumulatedText, status: 'complete' }
            : m
        ),
      }));

      try {
        useProjectsStore.getState().scheduleAutoSave();
      } catch {}
    } catch (err) {
      if (err.name === 'AbortError') {
        set((state) => ({
          isStreaming: false,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: accumulatedText, status: 'complete' }
              : m
          ),
        }));
      } else {
        const errorMsg = err.message || 'Failed to explain code snippet';
        set((state) => ({
          isStreaming: false,
          error: errorMsg,
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `⚠️ ${errorMsg}`, status: 'error', error: errorMsg }
              : m
          ),
        }));
      }
    } finally {
      currentAbortController = null;
      set({ isStreaming: false });
    }
  },

  // Request explanation for an assistant message that lacked explain blocks
  requestExplanationOnly: async (assistantMessage) => {
    if (!assistantMessage || get().isStreaming) return;
    const settings = useSettingsStore.getState();
    const { geminiKey, selectedModel, learnLevel, openSettings } = settings;

    if (!geminiKey) {
      openSettings();
      return;
    }

    const filesState = useProjectStore.getState().files;
    const userPrompt = `Please explain the code changes made in this step in simple terms for a ${learnLevel} coder. Return one explanation block for each changed file in \`\`\`explain:path format. Do NOT return any file code blocks.`;

    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'asst-' + (Date.now() + 1);

    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: userPrompt,
      displayContent: 'Explain changes in detail',
      status: 'complete',
    };

    const assistantPlaceholder = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      appliedFiles: [],
      status: 'streaming',
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantPlaceholder],
      isStreaming: true,
    }));

    currentAbortController = new AbortController();

    const systemPrompt = `You are a patient coding instructor.
The user is learning to code (${learnLevel} level).
Explain what was built and why.
For each file, output an explanation block:
\`\`\`explain:path/to/file.ext
Purpose: one sentence on what this file does.
Key parts:
- lines or function names: what they do and why
- (3 to 6 bullets)
Concept: one core concept in 1 to 2 sentences.
\`\`\`
Do NOT output any \`\`\`file: blocks.`;

    let accumulatedText = '';

    try {
      const stream = streamGemini({
        apiKey: geminiKey,
        model: selectedModel,
        systemPrompt,
        messages: [
          { role: 'user', content: assistantMessage.userPrompt || 'Explain the project' },
          { role: 'assistant', content: assistantMessage.content || '' },
          { role: 'user', content: userPrompt },
        ],
        signal: currentAbortController.signal,
      });

      for await (const chunk of stream) {
        accumulatedText += chunk;
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
          ),
        }));
      }

      const parsedExplanations = parseExplanations(accumulatedText);

      set((state) => ({
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: accumulatedText,
                explanations: parsedExplanations.length > 0 ? parsedExplanations : undefined,
                status: 'complete',
              }
            : m
        ),
      }));

      try {
        useProjectsStore.getState().scheduleAutoSave();
      } catch {}
    } catch (err) {
      set({ isStreaming: false });
    } finally {
      currentAbortController = null;
      set({ isStreaming: false });
    }
  },

  stopStreaming: () => {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    set({ isStreaming: false });
  },

  clearChat: () => {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    set({ messages: [], isStreaming: false, error: null });
    try {
      useProjectsStore.getState().scheduleAutoSave();
    } catch {}
  },
}));

