/**
 * Builds the AI fix prompt when an error occurs in the preview.
 */

function getFileExcerpt(content, errorLine, contextRadius = 10) {
  if (!content || typeof content !== 'string') return '';
  const lines = content.split('\n');
  const lineNum = parseInt(errorLine, 10);

  if (isNaN(lineNum) || lineNum <= 0) {
    // Return first 30 lines if line number is unknown
    return lines.slice(0, 30).map((l, i) => `${i + 1} | ${l}`).join('\n');
  }

  const start = Math.max(0, lineNum - 1 - contextRadius);
  const end = Math.min(lines.length, lineNum + contextRadius);

  return lines
    .slice(start, end)
    .map((l, i) => {
      const currentLine = start + i + 1;
      const marker = currentLine === lineNum ? '>' : ' ';
      return `${marker} ${currentLine.toString().padStart(4, ' ')} | ${l}`;
    })
    .join('\n');
}

export function buildFixPrompt({ errors = [], files = {}, projectType = 'vanilla', moreContext = false }) {
  const errorList = Array.isArray(errors) ? errors : [errors];
  const validErrors = errorList.filter(Boolean);

  let prompt = `My preview has an error. Please fix it.\n\n`;

  if (projectType === 'react') {
    prompt += `Project Type: React (Sandpack / Built-in React runner)\n`;
    prompt += `Note: For React built-in runner, line numbers in error traces can be approximate because JSX code is transformed in the browser.\n\n`;
  } else {
    prompt += `Project Type: Vanilla HTML/CSS/JS\n\n`;
  }

  const identifiedFiles = new Set();

  prompt += `### Error Details:\n`;
  validErrors.forEach((err, idx) => {
    let file = err.file || '';
    if (file && file !== 'unknown') {
      identifiedFiles.add(file);
    }
    const lineCol = err.line ? `${err.line}${err.column ? `:${err.column}` : ''}` : 'unknown';
    const stackSnippet = err.stack
      ? err.stack
          .split('\n')
          .slice(0, 5)
          .join('\n')
      : '';

    prompt += `Error ${idx + 1}:\n`;
    prompt += `- Message: ${err.message || 'Unknown error'}\n`;
    prompt += `- File: ${file || 'unknown'}\n`;
    prompt += `- Location: Line ${lineCol}\n`;
    if (stackSnippet) {
      prompt += `- Stack (first 5 lines):\n\`\`\`\n${stackSnippet}\n\`\`\`\n`;
    }
    prompt += `\n`;
  });

  // Attach code content for known error files
  const processedFiles = new Set();
  let excerptsText = `### Relevant Code Excerpts:\n`;

  validErrors.forEach((err) => {
    let filePath = err.file;
    if (filePath && filePath !== 'unknown') {
      // Find matching file in project files (with/without leading slash)
      let matchedContent = files[filePath];
      let resolvedKey = filePath;
      if (matchedContent === undefined) {
        if (filePath.startsWith('/') && files[filePath.slice(1)] !== undefined) {
          resolvedKey = filePath.slice(1);
          matchedContent = files[resolvedKey];
        } else if (!filePath.startsWith('/') && files[`/${filePath}`] !== undefined) {
          resolvedKey = `/${filePath}`;
          matchedContent = files[resolvedKey];
        }
      }

      if (matchedContent !== undefined && !processedFiles.has(resolvedKey)) {
        processedFiles.add(resolvedKey);
        // Send full file content so model has entire component context regardless of transformed line numbers
        excerptsText += `File: \`${resolvedKey}\`:\n\`\`\`\n${matchedContent}\n\`\`\`\n\n`;
      }
    }
  });

  // If no files matched or moreContext is requested, include full/partial content of key source files
  if (processedFiles.size === 0 || moreContext) {
    excerptsText += `### Project Source Files:\n`;
    const priorityFiles = projectType === 'react'
      ? ['/App.jsx', 'App.jsx', '/index.jsx', 'index.jsx', '/styles.css', 'styles.css', '/package.json', 'package.json']
      : ['script.js', '/script.js', 'index.html', '/index.html', 'style.css', '/style.css'];

    // Sort files by priority
    const sortedFileKeys = Object.keys(files).sort((a, b) => {
      const aIdx = priorityFiles.indexOf(a);
      const bIdx = priorityFiles.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

    for (const key of sortedFileKeys) {
      if (!moreContext && (key.endsWith('.css') || key.endsWith('.json')) && processedFiles.size > 0) {
        continue;
      }

      const content = files[key] || '';
      const lines = content.split('\n');
      const maxLines = moreContext ? 500 : 300;
      const trimmedContent = lines.length > maxLines
        ? lines.slice(0, maxLines).join('\n') + `\n// ... [trimmed ${lines.length - maxLines} lines]`
        : content;

      excerptsText += `File: \`${key}\`:\n\`\`\`\n${trimmedContent}\n\`\`\`\n\n`;
    }
  }

  prompt += excerptsText;

  const targetFileList = Array.from(identifiedFiles).join(', ');
  const hasKnownFile = targetFileList.length > 0;
  
  let instructionsText = `### Instructions:\n`;
  if (hasKnownFile) {
    instructionsText += `1. The error is located in: \`${targetFileList}\`. You MUST fix the error in that file.\n`;
    instructionsText += `2. Line numbers in the error report may be inaccurate. Find the cause from the message and the code.\n`;
    instructionsText += `3. Return ONLY the files that must change, using the \`\`\`file:path format with FULL file content.\n`;
    instructionsText += `4. Do NOT modify unrelated files (such as \`styles.css\` or \`index.html\`) unless the error message explicitly points to them.\n`;
  } else {
    instructionsText += `1. The error file is unknown. Inspect all the provided source files carefully.\n`;
    instructionsText += `2. If the code is already valid, reply exactly: NO_CHANGE_NEEDED and do not return any files.\n`;
    instructionsText += `3. Otherwise, return ONLY the file that contains the actual bug, using the \`\`\`file:path format with FULL file content.\n`;
  }
  instructionsText += `5. Briefly explain the root cause and the fix in 1-2 sentences.\n`;
  instructionsText += `6. Ensure all React hooks (useState, useEffect, etc.) are properly imported from "react".\n`;
  instructionsText += `7. Wrap any localStorage access in try/catch and fall back to in-memory state.`;

  prompt += instructionsText;

  // Cap total prompt size at ~12,000 characters
  if (prompt.length > 12000) {
    prompt = prompt.slice(0, 11800) + '\n\n// ... [Content trimmed to fit context limit]\n\n' + prompt.slice(-600);
  }

  return prompt;
}
