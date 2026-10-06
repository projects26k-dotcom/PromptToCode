const DEFAULT_PACKAGE_JSON = JSON.stringify(
  {
    name: 'react-prompttocode',
    version: '1.0.0',
    main: '/index.jsx',
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'lucide-react': '^1.16.0',
    },
  },
  null,
  2
);

const DEFAULT_PUBLIC_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React PromptToCode</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const DEFAULT_STYLES_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  min-height: 100vh;
}`;

const DEFAULT_INDEX_JSX = `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`;

const DEFAULT_APP_JSX = `import React from 'react';
import './styles.css';

export default function App() {
  return (
    <div className="container">
      <div className="card">
        <h1>✨ React App</h1>
        <p>Edit /App.jsx to build your app.</p>
      </div>
    </div>
  );
}`;

function injectReactImportsIfNeeded(code) {
  if (typeof code !== 'string') return code;

  const usesHooks = /\b(useState|useEffect|useRef|useMemo|useCallback|useContext|useReducer)\b/.test(code);
  const importsFromReact = /from\s+['"]react['"]/.test(code);

  if (!importsFromReact) {
    if (usesHooks || /<[A-Za-z]/.test(code)) {
      return `import React, { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer } from 'react';\n${code}`;
    }
  } else if (usesHooks) {
    const namedImportsMatch = code.match(/import\s+(?:React\s*,?\s*)?(?:\{([^}]+)\})?\s+from\s+['"]react['"]/);
    if (namedImportsMatch) {
      const importedNames = (namedImportsMatch[1] || '').split(',').map((s) => s.trim());
      const hookNames = ['useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useReducer'];
      const missingHooks = hookNames.filter((h) => new RegExp(`\\b${h}\\b`).test(code) && !importedNames.includes(h));

      if (missingHooks.length > 0) {
        return code.replace(
          /import\s+.*?from\s+['"]react['"];?/,
          `import React, { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer } from 'react';`
        );
      }
    }
  }

  return code;
}

/**
 * Sanitizes and formats files for Sandpack React template.
 * Prevents invalid JSON or missing entry files from crashing Sandpack.
 */
export function sanitizeSandpackFiles(files = {}, theme = 'dark') {
  const sanitized = {};
  let warnings = [];
  const isLight = theme === 'light';

  // Normalize all paths to have leading slashes
  for (const [rawPath, content] of Object.entries(files)) {
    if (!rawPath) continue;
    const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

    // Skip empty non-essential files
    if (typeof content !== 'string') continue;

    // Validate package.json
    if (cleanPath === '/package.json') {
      try {
        JSON.parse(content);
        sanitized[cleanPath] = { code: content };
      } catch (err) {
        warnings.push('Invalid /package.json detected and replaced with default.');
        sanitized[cleanPath] = { code: DEFAULT_PACKAGE_JSON };
      }
    } else if (cleanPath.endsWith('.jsx') || cleanPath.endsWith('.js')) {
      sanitized[cleanPath] = { code: injectReactImportsIfNeeded(content) };
    } else {
      sanitized[cleanPath] = { code: content };
    }
  }

  // Ensure default package.json if missing
  if (!sanitized['/package.json']) {
    sanitized['/package.json'] = { code: DEFAULT_PACKAGE_JSON };
  } else {
    try {
      const parsedPkg = JSON.parse(sanitized['/package.json'].code);
      if (!parsedPkg.main) {
        parsedPkg.main = '/index.jsx';
        sanitized['/package.json'] = { code: JSON.stringify(parsedPkg, null, 2) };
      }
    } catch {}
  }

  // Ensure /index.jsx exists
  if (!sanitized['/index.jsx'] && !sanitized['/src/index.jsx']) {
    sanitized['/index.jsx'] = { code: DEFAULT_INDEX_JSX };
  }

  // Ensure /App.jsx exists
  if (!sanitized['/App.jsx'] && !sanitized['/src/App.jsx']) {
    sanitized['/App.jsx'] = { code: DEFAULT_APP_JSX };
  }

  // Bridge .jsx to .js for Sandpack internal bundler resolution
  if (sanitized['/index.jsx'] && !sanitized['/index.js']) {
    sanitized['/index.js'] = sanitized['/index.jsx'];
  }
  if (sanitized['/App.jsx'] && !sanitized['/App.js']) {
    sanitized['/App.js'] = sanitized['/App.jsx'];
  }

  // Ensure /public/index.html exists
  if (!sanitized['/public/index.html'] && !sanitized['/index.html']) {
    sanitized['/public/index.html'] = { code: DEFAULT_PUBLIC_HTML };
  }

  // Ensure /styles.css exists
  if (!sanitized['/styles.css']) {
    sanitized['/styles.css'] = { code: DEFAULT_STYLES_CSS };
  }

  // If light theme is active, inject light mode styles into styles.css and index.html
  if (isLight) {
    const lightCssRules = `\n/* Light Theme Mode Injected */
body {
  background: #f8fafc !important;
  color: #0f172a !important;
}
.card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08) !important;
}
.tagline {
  color: #64748b !important;
}
#output, .output {
  color: #0284c7 !important;
}
`;
    if (sanitized['/styles.css']) {
      sanitized['/styles.css'] = {
        code: sanitized['/styles.css'].code + lightCssRules
      };
    }
    const htmlKey = sanitized['/public/index.html'] ? '/public/index.html' : sanitized['/index.html'] ? '/index.html' : null;
    if (htmlKey && sanitized[htmlKey]) {
      const styleTag = `<style id="sandpack-light-theme">${lightCssRules}</style>`;
      sanitized[htmlKey] = {
        code: sanitized[htmlKey].code.replace('</head>', `${styleTag}</head>`)
      };
    }
  }

  return { files: sanitized, warnings };
}
