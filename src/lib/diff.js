/**
 * Line-based diff stats calculator.
 * Returns { added, removed } line counts comparing original and proposed strings.
 */
export function getDiffStats(original = '', proposed = '') {
  if (original === proposed) {
    return { added: 0, removed: 0 };
  }

  const origLines = (original || '').split(/\r?\n/);
  const propLines = (proposed || '').split(/\r?\n/);

  if (!original) {
    return { added: propLines.length, removed: 0 };
  }
  if (!proposed) {
    return { added: 0, removed: origLines.length };
  }

  // Count matches using multiset comparison of lines
  const origCounts = new Map();
  for (const line of origLines) {
    origCounts.set(line, (origCounts.get(line) || 0) + 1);
  }

  let unchangedCount = 0;
  for (const line of propLines) {
    const count = origCounts.get(line) || 0;
    if (count > 0) {
      unchangedCount++;
      origCounts.set(line, count - 1);
    }
  }

  const added = Math.max(0, propLines.length - unchangedCount);
  const removed = Math.max(0, origLines.length - unchangedCount);

  return { added, removed };
}
