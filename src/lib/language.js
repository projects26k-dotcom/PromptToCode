/**
 * Maps file extension to Monaco Editor language identifiers.
 * Supports html, css, js, jsx, ts, tsx, json, py, md, java, cpp, go.
 * Defaults to 'plaintext'.
 */
export function getLanguage(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'plaintext';
  }

  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';

  const languageMap = {
    html: 'html',
    htm: 'html',
    css: 'css',
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    py: 'python',
    md: 'markdown',
    markdown: 'markdown',
    java: 'java',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    go: 'go',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
  };

  return languageMap[ext] || 'plaintext';
}
