/**
 * Plan Mode Prompt Builder and Heuristics (Phase 1)
 */

/**
 * Checks if planning should be skipped for short/direct commands.
 */
export function shouldSkipPlanning(prompt, files = {}) {
  if (!prompt || typeof prompt !== 'string') return true;
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 8) return true;

  const hasExistingFiles = Object.keys(files || {}).length > 0;
  if (hasExistingFiles) {
    if (/^(?:change|make|fix|rename|add\s+a)\b/i.test(prompt.trim())) {
      return true;
    }
  }
  return false;
}

/**
 * Builds the planning system prompt for Gemini.
 */
export function buildPlanSystemPrompt({ files = {}, activeFile = null, projectType = 'vanilla' } = {}) {
  const fileList = Object.keys(files || {});
  let filesContext = '';
  if (fileList.length > 0) {
    filesContext = `\nCurrent project files:\n${fileList
      .map((path) => {
        const content = files[path] || '';
        const preview = content.length > 300 ? content.slice(0, 300) + '...' : content;
        return `--- ${path} ---\n${preview}`;
      })
      .join('\n\n')}`;
  }

  return `You are PromptToCode Plan Architect.
Your task is to propose a concise, high-level implementation plan for the user's request before writing code.

CRITICAL INSTRUCTIONS:
1. Do NOT write any full code and do NOT return \`\`\`file: blocks.
2. Return ONLY a plan block in this exact format:
\`\`\`plan
Summary: one sentence describing the goal and solution.
Files:
- /path/to/file.ext (new|edit): what it will contain or change
Steps:
1. short step
2. short step
Questions: (optional, max 2 short questions if the request is ambiguous)
\`\`\`
3. Keep the plan under 12 lines.
4. If there are no clarifying questions needed, omit the Questions section.
5. Project type: ${projectType === 'react' ? 'React (Tailwind CSS, Lucide icons, components)' : 'Vanilla JS/HTML/CSS'}.
${filesContext}`;
}

/**
 * Builds the prompt for Phase 2 (Code Generation) after user approves or modifies the plan.
 */
export function buildApprovedPlanPrompt({ originalPrompt, plan, selectedFiles, userNote, answers }) {
  const approvedFilesList = (plan.files || [])
    .filter((f) => !selectedFiles || selectedFiles.includes(f.path))
    .map((f) => `- ${f.path} (${f.kind || 'edit'}): ${f.description}`)
    .join('\n');

  const stepsList = (plan.steps || [])
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');

  let extra = '';
  if (answers && Object.keys(answers).length > 0) {
    const ansStr = Object.entries(answers)
      .filter(([_, ans]) => ans && ans.trim())
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n');
    if (ansStr) {
      extra += `\nUser Clarifications / Answers:\n${ansStr}\n`;
    }
  }

  if (userNote && userNote.trim()) {
    extra += `\nUser Custom Note / Preferences:\n${userNote.trim()}\n`;
  }

  return `Original Request: ${originalPrompt}

Approved Plan:
Summary: ${plan.summary || 'Build requested feature'}
Approved Files:
${approvedFilesList || '- (Create/edit required project files)'}
Steps:
${stepsList || '1. Implement solution according to plan'}
${extra}
INSTRUCTION: Build exactly this approved plan. Create or change only the approved files. Follow all normal file-format rules and output complete code.`;
}
