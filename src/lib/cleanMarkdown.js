/**
 * Cleans and normalizes markdown copied from ChatGPT, Claude, Notion, etc.
 * when pasting into the prompt input box.
 */
export function cleanPastedMarkdown(text) {
  if (!text || typeof text !== 'string') return text;

  let cleaned = text;

  // 1. Remove Markdown headers: ### Heading -> Heading
  cleaned = cleaned.replace(/^(\s*)#{1,6}\s+/gm, '$1');

  // 2. Convert asterisk, plus, or dash bullet points at line starts to standard bullet symbol:
  // e.g. "* Item" or "- Item" or "+ Item" -> "• Item"
  cleaned = cleaned.replace(/^(\s*)[*+\-]\s+/gm, '$1• ');

  // 3. Remove Markdown bold and italic formatting:
  // ***bold italic*** -> bold italic
  cleaned = cleaned.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  cleaned = cleaned.replace(/___([^_]+)___/g, '$1');
  // **bold** -> bold
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  // *italic* -> italic (when bounded by whitespace/punctuation)
  cleaned = cleaned.replace(/(^|\s)\*([^*\n]+)\*(\s|$|[.,!?:;])/g, '$1$2$3');
  cleaned = cleaned.replace(/(^|\s)_([^_\n]+)_(\s|$|[.,!?:;])/g, '$1$2$3');

  // 4. Remove Markdown blockquotes: > quote -> quote
  cleaned = cleaned.replace(/^(\s*)>\s+/gm, '$1');

  // 5. Remove Markdown links: [Title](url) -> Title (url)
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // 6. Fix excessive blank lines between consecutive bullet points:
  // e.g. "• Item 1\n\n• Item 2" -> "• Item 1\n• Item 2"
  cleaned = cleaned.replace(/(•[^\n]+)\n\n+(?=\s*•)/g, '$1\n');

  // 7. Collapse 3 or more consecutive newlines down to 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned;
}
