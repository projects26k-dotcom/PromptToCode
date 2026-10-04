/**
 * Ultra-tolerant multi-pattern parser that extracts files, explanations, and plans from AI responses.
 * 
 * Handles:
 * - Header tags: ```file:App.jsx, ```file:/App.jsx, ```jsx file:App.jsx, ```js title="App.jsx", ```jsx:App.jsx, ```App.jsx
 * - Explanations: ```explain:App.jsx, ```explain:/App.jsx
 * - Plans: ```plan ... ```
 * - First-line comments: // File: /App.jsx, // App.jsx, /* App.jsx *\/, <!-- index.html -->
 * - Preceding headings/bolds: ### App.jsx, **App.jsx**, **File: App.jsx**, App.jsx:
 * - Deduplication (last one wins) and leading slash normalization
 */

export function cleanFilePath(raw) {
  if (!raw) return '';
  let p = raw
    .trim()
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/^(?:file|filename|title|explain|plan)\s*[:=]\s*/i, '')
    .replace(/^file:\s*/i, '')
    .replace(/^explain:\s*/i, '')
    .replace(/^plan:\s*/i, '')
    .replace(/^\.?\//, '')
    .trim();

  // If path was given with leading slash like "/App.jsx" or "App.jsx"
  // keep consistency with leading slash if present or normalize
  return p ? (p.startsWith('/') ? p : '/' + p) : '';
}

export function parseStreamingFiles(text) {
  if (!text || typeof text !== 'string') return [];

  const filesMap = new Map();

  // Match all fenced code blocks: ```<header>\n<content>``` or streaming ```<header>\n<content>$
  const blockRegex = /```([^\n\r]*)[\r\n]+([\s\S]*?)(?:```|$)/g;

  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    const rawHeader = (match[1] || '').trim();
    let content = match[2] || '';
    const fullMatch = match[0];
    const isComplete = fullMatch.endsWith('```');

    // Never parse explain or plan blocks as code files
    if (
      /^(?:explain|plan)\b/i.test(rawHeader) ||
      rawHeader.toLowerCase().includes('explain:') ||
      rawHeader.toLowerCase().includes('plan')
    ) {
      continue;
    }

    let filePath = null;

    // 1. Check header for file path or attributes
    // e.g. "file:App.jsx", "jsx file:App.jsx", "js title='App.jsx'", "file:/styles.css", "jsx:App.jsx", "App.jsx"
    const headerFileMatch = rawHeader.match(/(?:file|filename|title)?\s*[:=]?\s*["'(\[]?\s*([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)\s*["')\]]?/i);
    if (headerFileMatch && headerFileMatch[1] && headerFileMatch[1].includes('.')) {
      filePath = headerFileMatch[1];
    }

    // 2. Check first line of content for comment naming a path
    // e.g. "// File: /App.jsx", "/* App.jsx */", "<!-- index.html -->", "# script.py", "// App.jsx"
    if (!filePath) {
      const firstLineMatch = content.match(/^\s*(?:\/\/|#|\/\*|<!--)\s*(?:[Ff]ile:?\s*)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?:\s*\*\/|\s*-->)?[\r\n]+/);
      if (firstLineMatch && firstLineMatch[1] && firstLineMatch[1].includes('.')) {
        filePath = firstLineMatch[1];
        // Strip the comment line from file content
        content = content.slice(firstLineMatch[0].length);
      }
    }

    // 3. Check text immediately preceding the fenced code block
    // e.g. "### App.jsx", "**App.jsx**", "App.jsx:", "--- App.jsx ---"
    if (!filePath) {
      const precedingText = text.slice(Math.max(0, match.index - 300), match.index);
      const precedingMatch = precedingText.match(/(?:###?|\*\*|__|\*|---|===)?\s*(?:[Ff]ile:?\s*)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?:\*\*|__|:|\s*---|\s*===)?\s*$/m);
      if (precedingMatch && precedingMatch[1] && precedingMatch[1].includes('.')) {
        filePath = precedingMatch[1];
      }
    }

    if (filePath) {
      const clean = cleanFilePath(filePath);
      if (clean && clean.includes('.')) {
        // Last block for the same path wins
        filesMap.set(clean, {
          path: clean,
          content: isComplete ? content.replace(/```$/, '') : content,
          isComplete,
        });
      }
    }
  }

  return Array.from(filesMap.values());
}

/**
 * Returns array of completed files with deduplicated paths (last block wins).
 */
export function parseFiles(text) {
  const all = parseStreamingFiles(text);
  return all.map((f) => ({ path: f.path, content: f.content }));
}

/**
 * Extracts explanation blocks from response:
 * ```explain:/path/to/file.ext
 * Purpose: ...
 * Key parts:
 * - ...
 * Concept: ...
 * ```
 */
export function parseExplanations(text) {
  if (!text || typeof text !== 'string') return [];

  const explanations = [];
  const explainBlockRegex = /```explain:([^\n\r]+)[\r\n]+([\s\S]*?)```/gi;

  let match;
  while ((match = explainBlockRegex.exec(text)) !== null) {
    const rawPath = match[1].trim();
    const body = match[2].trim();
    const cleanPath = cleanFilePath(rawPath);

    // Extract Purpose
    let purpose = '';
    const purposeMatch = body.match(/Purpose:\s*([^\n\r]+(?:\n(?!\s*(?:Key parts|Concept):)[^\n\r]+)*)/i);
    if (purposeMatch) {
      purpose = purposeMatch[1].trim();
    }

    // Extract Key parts bullets
    const keyParts = [];
    const keyPartsBlockMatch = body.match(/Key parts:\s*([\s\S]*?)(?=(?:Concept:|$))/i);
    if (keyPartsBlockMatch) {
      const bulletLines = keyPartsBlockMatch[1].split('\n');
      for (const line of bulletLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
          const cleanBullet = trimmed.replace(/^[-*•]\s*/, '').trim();
          if (cleanBullet) {
            keyParts.push(cleanBullet);
          }
        }
      }
    }

    // Extract Concept
    let concept = '';
    const conceptMatch = body.match(/Concept:\s*([\s\S]*?)$/i);
    if (conceptMatch) {
      concept = conceptMatch[1].trim();
    }

    if (cleanPath) {
      explanations.push({
        path: cleanPath,
        purpose: purpose || 'Updates component logic and design.',
        keyParts: keyParts.length > 0 ? keyParts : ['- Integrates application state and structure'],
        concept: concept || '',
      });
    }
  }

  return explanations;
}

/**
 * Extracts plan block from response:
 * ```plan
 * Summary: ...
 * Files:
 * - /path/to/file.ext (new|edit): ...
 * Steps:
 * 1. ...
 * Questions:
 * - ...
 * ```
 */
export function parsePlan(text) {
  if (!text || typeof text !== 'string') return null;

  // Match ```plan ... (``` or end of string)
  const planBlockMatch = text.match(/```plan[\r\n]+([\s\S]*?)(?:```|$)/i);
  if (!planBlockMatch) return null;

  const body = planBlockMatch[1];

  // Extract Summary
  let summary = '';
  const summaryMatch = body.match(/Summary:\s*([^\n\r]+(?:\n(?!\s*(?:Files|Steps|Questions):)[^\n\r]+)*)/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  // Extract Files
  const files = [];
  const filesBlockMatch = body.match(/Files:\s*([\s\S]*?)(?=(?:Steps:|Questions:|$))/i);
  if (filesBlockMatch) {
    const lines = filesBlockMatch[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        const cleanLine = trimmed.replace(/^[-*•]\s*/, '').trim();
        const fileLineMatch = cleanLine.match(/^([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?:\s*\((new|edit|create|update)\))?\s*[:\-–]\s*(.*)$/i);
        if (fileLineMatch) {
          const rawPath = fileLineMatch[1];
          const rawKind = (fileLineMatch[2] || 'edit').toLowerCase();
          const kind = rawKind === 'create' || rawKind === 'new' ? 'new' : 'edit';
          const description = (fileLineMatch[3] || '').trim();
          const cleanPath = cleanFilePath(rawPath);
          if (cleanPath) {
            files.push({ path: cleanPath, kind, description: description || 'Component updates' });
          }
        } else {
          const simpleMatch = cleanLine.match(/^([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)\s*(.*)$/);
          if (simpleMatch) {
            const cleanPath = cleanFilePath(simpleMatch[1]);
            const isNew = /\bnew\b/i.test(cleanLine);
            if (cleanPath) {
              files.push({
                path: cleanPath,
                kind: isNew ? 'new' : 'edit',
                description: simpleMatch[2].replace(/^[:\-–\s]+/, '').trim() || 'Updates',
              });
            }
          }
        }
      }
    }
  }

  // Extract Steps
  const steps = [];
  const stepsBlockMatch = body.match(/Steps:\s*([\s\S]*?)(?=(?:Questions:|$))/i);
  if (stepsBlockMatch) {
    const lines = stepsBlockMatch[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\d+[\.\)]\s*/.test(trimmed) || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        const stepText = trimmed.replace(/^(?:\d+[\.\)]|[-*•])\s*/, '').trim();
        if (stepText) {
          steps.push(stepText);
        }
      }
    }
  }

  // Extract Questions
  const questions = [];
  const questionsBlockMatch = body.match(/Questions:\s*([\s\S]*?)$/i);
  if (questionsBlockMatch) {
    const lines = questionsBlockMatch[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || /^\(?optional\)?$/i.test(trimmed) || /^none\b/i.test(trimmed)) continue;
      if (/^\d+[\.\)]\s*/.test(trimmed) || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•') || trimmed.includes('?')) {
        const qText = trimmed.replace(/^(?:\d+[\.\)]|[-*•])\s*/, '').trim();
        if (qText && qText.length > 3 && !qText.toLowerCase().startsWith('optional')) {
          questions.push(qText);
        }
      }
    }
  }

  if (!summary && files.length === 0 && steps.length === 0) {
    return null;
  }

  return {
    summary: summary || 'Proposed implementation plan',
    files,
    steps,
    questions,
  };
}

/**
 * Strips code blocks, file headers, explain blocks, and plan blocks from text for clean markdown chat display.
 */
export function stripFileBlocks(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/```plan[\r\n]+[\s\S]*?(?:```|$)/gi, '')
    .replace(/```explain:[^\n\r]*[\r\n]+[\s\S]*?(?:```|$)/gi, '')
    .replace(/```[^\n\r]*[\r\n]+[\s\S]*?(?:```|$)/g, '')
    .replace(/(?:###?|\*\*|__)\s*(?:[Ff]ile:?\s*)?[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+(?:\*\*|__)?[\r\n]+/gi, '')
    .replace(/(?:---|===)\s*(?:FILE:\s*)?[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+\s*(?:---|===)[\r\n]+/gi, '')
    .trim();
}

/**
 * Extracts list of file paths found in the text.
 */
export function extractFilePaths(text) {
  return parseStreamingFiles(text).map((f) => f.path);
}
