/**
 * Standalone Built-in React Runner
 * 
 * Compiles and executes React JSX/JS files in a sandboxed iframe without Sandpack,
 * using React 18 UMD, ReactDOM 18 UMD, and @babel/standalone from CDN.
 * Includes safe JSON serialization, CommonJS module resolver, CSS injector,
 * in-memory localStorage fallback, error attribution (compile/runtime/runner), and console bridge.
 */

function serializeForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/<\/script/gi, '<\\/script');
}

export function buildReactPreviewHtml(files = {}) {
  const safeSourcesJson = serializeForScript(files);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VibeForge React Runner</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.4/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
    }
    #error-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.95);
      color: #f87171;
      padding: 24px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
      z-index: 999999;
      overflow: auto;
      white-space: pre-wrap;
      border-top: 4px solid #ef4444;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error-overlay"></div>

  <script>
    (function() {
      // 1. Injected Sources Object
      const __SOURCES__ = ${safeSourcesJson};

      // 2. Safe argument serializer for console output
      function formatArg(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
        if (typeof arg === 'bigint') return arg + 'n';
        if (typeof arg === 'symbol') return arg.toString();
        if (typeof arg === 'function') return '[Function: ' + (arg.name || 'anonymous') + ']';
        if (arg instanceof Error) {
          return (arg.name || 'Error') + ': ' + arg.message + (arg.stack ? '\\n' + arg.stack : '');
        }
        if (arg && arg.nodeType === 1) {
          return arg.outerHTML ? arg.outerHTML.slice(0, 200) : '<' + arg.tagName.toLowerCase() + '>';
        }
        try {
          var seen = [];
          return JSON.stringify(arg, function(key, val) {
            if (typeof val === 'object' && val !== null) {
              if (seen.indexOf(val) >= 0) return '[Circular]';
              seen.push(val);
            }
            if (typeof val === 'function') return '[Function]';
            if (typeof val === 'symbol') return val.toString();
            if (typeof val === 'bigint') return val + 'n';
            return val;
          }, 2);
        } catch (e) {
          return String(arg);
        }
      }

      function sendLog(level, rawArgs) {
        try {
          var formatted = Array.prototype.slice.call(rawArgs).map(formatArg).join(' ');
          window.parent.postMessage({
            source: 'vibeforge-preview',
            type: 'console',
            level: level,
            message: formatted
          }, '*');
        } catch (err) {}
      }

      var origLog = console.log;
      var origWarn = console.warn;
      var origError = console.error;
      var origInfo = console.info;

      console.log = function() {
        sendLog('log', arguments);
        if (origLog) origLog.apply(console, arguments);
      };
      console.info = function() {
        sendLog('info', arguments);
        if (origInfo) origInfo.apply(console, arguments);
      };
      console.warn = function() {
        sendLog('warn', arguments);
        if (origWarn) origWarn.apply(console, arguments);
      };
      console.error = function() {
        sendLog('error', arguments);
        if (origError) origError.apply(console, arguments);
      };

      // 3. Error Overlay & Reporting Bridge
      var errorOverlay = document.getElementById('error-overlay');
      function reportError(kind, file, message, line, column, stack) {
        if (errorOverlay) {
          errorOverlay.style.display = 'block';
          var header = kind === 'compile' ? '⚠️ Babel Compilation Error' : kind === 'runtime' ? '⚠️ Runtime Error' : '⚠️ Runner Error';
          var locationInfo = file ? (' in ' + file + (line ? ':' + line + (column ? ':' + column : '') : '')) : '';
          errorOverlay.textContent = header + locationInfo + '\\n\\n' + (stack || message);
        }

        try {
          window.parent.postMessage({
            source: 'vibeforge-preview',
            type: 'error',
            kind: kind || 'runtime',
            file: file || '',
            line: line,
            column: column,
            message: message || 'Unknown error',
            stack: stack || ''
          }, '*');
        } catch (postErr) {}
      }

      // Stack parsing helper to match known source files
      function parseStack(stack) {
        var file = '';
        var line;
        var column;
        if (!stack) return { file: file, line: line, column: column };

        // 1. Check for [as ComponentName.jsx]
        var asMatch = stack.match(/\\[as\\s+([^\\]]+)\\]/i);
        if (asMatch) {
          var asName = asMatch[1].trim();
          file = asName.startsWith('/') ? asName : '/' + asName;
        }

        // 2. Check all known project source keys
        if (!file) {
          var sourceKeys = Object.keys(__SOURCES__);
          for (var i = 0; i < sourceKeys.length; i++) {
            var k = sourceKeys[i];
            var baseName = k.replace(/^\\//, '');
            if (stack.indexOf(k) >= 0 || stack.indexOf(baseName) >= 0) {
              file = k.startsWith('/') ? k : '/' + k;
              break;
            }
          }
        }

        // 3. Regex match for filename
        var match = stack.match(/(?:\\/|\\\\|\\b)([a-zA-Z0-9_\\-\\.]+\\.(?:jsx?|tsx?|json|css))(?::(\\d+))?(?::(\\d+))?/i);
        if (match) {
          if (!file) file = match[1].startsWith('/') ? match[1] : '/' + match[1];
          if (match[2]) line = parseInt(match[2], 10);
          if (match[3]) column = parseInt(match[3], 10);
        }

        return { file: file, line: line, column: column };
      }

      window.addEventListener('error', function(e) {
        if (e.target && e.target.tagName === 'IMG') return;
        if (e.error && e.error.__reported) return;
        var stack = e.error && e.error.stack ? e.error.stack : '';
        var errMsg = (e.error ? (e.error.message || formatArg(e.error)) : e.message) || 'Uncaught Error';
        var parsed = parseStack(stack);
        var file = parsed.file;
        var kind = file ? 'runtime' : 'runner';

        reportError(kind, file, errMsg, parsed.line || e.lineno, parsed.column || e.colno, stack);
      });

      // Image error fallback listener (capture phase): 1 retry with cache buster after 1.5s, then soft gradient placeholder
      document.addEventListener('error', function(e) {
        if (e.target && e.target.tagName === 'IMG') {
          var img = e.target;
          if (img.dataset.hasFailedFinal) return;

          if (!img.dataset.retryCount) {
            img.dataset.retryCount = '1';
            setTimeout(function() {
              var originalSrc = img.src || '';
              if (originalSrc && !originalSrc.startsWith('data:')) {
                var sep = originalSrc.indexOf('?') >= 0 ? '&' : '?';
                img.src = originalSrc + sep + '_retry=' + Date.now();
              }
            }, 1500);
          } else {
            img.dataset.hasFailedFinal = '1';
            var w = parseInt(img.getAttribute('width'), 10) || img.clientWidth || img.offsetWidth || 300;
            var h = parseInt(img.getAttribute('height'), 10) || img.clientHeight || img.offsetHeight || 200;
            var altText = img.getAttribute('alt') || img.title || 'Image';
            var safeAlt = String(altText).replace(/[<>&"]/g, '');
            
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
              '<defs>' +
              '<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
              '<stop offset="0%" stop-color="#1e1b4b"/>' +
              '<stop offset="50%" stop-color="#312e81"/>' +
              '<stop offset="100%" stop-color="#0f172a"/>' +
              '</linearGradient>' +
              '</defs>' +
              '<rect width="100%" height="100%" fill="url(#bgGrad)"/>' +
              '<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#cbd5e1" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="500" opacity="0.85">' +
              safeAlt +
              '</text>' +
              '</svg>';
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
            img.style.objectFit = 'cover';
          }
        }
      }, true);

      window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && e.reason.__reported) return;
        var reason = e.reason;
        var stack = reason && reason.stack ? reason.stack : '';
        var errMsg = 'Unhandled Promise Rejection: ' + (reason ? (reason.message || formatArg(reason)) : 'Unknown reason');
        var parsed = parseStack(stack);
        var file = parsed.file;
        var kind = file ? 'runtime' : 'runner';

        reportError(kind, file, errMsg, parsed.line, parsed.column, stack);
      });

      // 4. In-memory localStorage Polyfill
      try {
        var test = window.localStorage;
        if (test) test.getItem('_test');
      } catch (lsErr) {
        var memStore = {};
        try {
          Object.defineProperty(window, 'localStorage', {
            value: {
              getItem: function(k) { return memStore.hasOwnProperty(k) ? memStore[k] : null; },
              setItem: function(k, v) { memStore[k] = String(v); },
              removeItem: function(k) { delete memStore[k]; },
              clear: function() { memStore = {}; },
              get length() { return Object.keys(memStore).length; },
              key: function(i) { return Object.keys(memStore)[i] || null; }
            },
            configurable: true,
            writable: true
          });
        } catch (e) {}
      }

      // 5. Validate CDN Dependencies
      if (!window.React || !window.ReactDOM || !window.Babel) {
        reportError('runner', '', 'Failed to load React or Babel from CDN. Please check your network connection.');
        return;
      }

      // 6. CommonJS Module Resolver & Sandbox Execution
      var moduleCache = {};
      var moduleFactories = {};

      function normalizePath(p) {
        if (!p) return '';
        return p.replace(/^[\\.\\/]+/, '').trim();
      }

      function findFile(reqPath) {
        var clean = normalizePath(reqPath);
        var candidates = [
          clean,
          '/' + clean,
          clean + '.jsx',
          '/' + clean + '.jsx',
          clean + '.js',
          '/' + clean + '.js',
          clean + '.json',
          '/' + clean + '.json',
          clean + '.css',
          '/' + clean + '.css',
          clean + '/index.jsx',
          '/' + clean + '/index.jsx',
          clean + '/index.js',
          '/' + clean + '/index.js'
        ];
        for (var i = 0; i < candidates.length; i++) {
          var c = candidates[i];
          if (c in __SOURCES__ && typeof __SOURCES__[c] === 'string') {
            return { path: c.startsWith('/') ? c : '/' + c, content: __SOURCES__[c] };
          }
        }
        return null;
      }

      // Inject root styles.css if present
      var rootCss = findFile('/styles.css');
      if (rootCss) {
        var rootStyleEl = document.createElement('style');
        rootStyleEl.setAttribute('data-file', rootCss.path);
        rootStyleEl.textContent = rootCss.content;
        document.head.appendChild(rootStyleEl);
      }

      function customRequire(callerPath, importPath) {
        var raw = importPath.trim();

        if (raw === 'react') return window.React;
        if (raw === 'react-dom') return window.ReactDOM;
        if (raw === 'react-dom/client') {
          return {
            createRoot: window.ReactDOM.createRoot ? window.ReactDOM.createRoot.bind(window.ReactDOM) : function(container) {
              return {
                render: function(element) { window.ReactDOM.render(element, container); }
              };
            }
          };
        }
        if (raw === 'lucide-react') {
          return new Proxy({}, {
            get: function(target, prop) {
              if (prop === '__esModule') return true;
              return function IconPlaceholder(props) {
                return window.React.createElement('span', {
                  style: Object.assign({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }, props && props.style),
                  title: String(prop)
                }, '⚡');
              };
            }
          });
        }

        if (!raw.startsWith('.') && !raw.startsWith('/')) {
          throw new Error("Package '" + raw + "' is not supported in the built-in runner.");
        }

        if (raw.endsWith('.css') || raw.includes('.css')) {
          var cssFile = findFile(raw);
          if (cssFile) {
            var styleEl = document.createElement('style');
            styleEl.setAttribute('data-file', cssFile.path);
            styleEl.textContent = cssFile.content;
            document.head.appendChild(styleEl);
          }
          return {};
        }

        if (raw.endsWith('.json') || raw.includes('.json')) {
          var jsonFile = findFile(raw);
          if (jsonFile) {
            try {
              return JSON.parse(jsonFile.content);
            } catch (jsonErr) {
              reportError('compile', jsonFile.path, 'Invalid JSON in ' + jsonFile.path + ': ' + jsonErr.message, 1, 1);
              throw jsonErr;
            }
          }
        }

        var target = findFile(raw);
        if (!target) {
          throw new Error("Cannot resolve module '" + raw + "' from '" + callerPath + "'");
        }

        var targetKey = normalizePath(target.path);
        if (moduleCache[targetKey]) {
          return moduleCache[targetKey].exports;
        }

        if (!moduleFactories[targetKey]) {
          var codeToTransform = target.content;
          if (!/from\\s+['"]react['"]/.test(codeToTransform)) {
            if (/\\b(useState|useEffect|useRef|useMemo|useCallback|useContext|useReducer)\\b/.test(codeToTransform) || /<[A-Za-z]/.test(codeToTransform)) {
              codeToTransform = 'import React, { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer } from "react";\\n' + codeToTransform;
            }
          }

          var transformed;
          try {
            transformed = Babel.transform(codeToTransform, {
              presets: [
                'react',
                ['env', { modules: 'commonjs' }]
              ],
              filename: target.path,
              sourceFileName: target.path
            }).code;
            transformed += '\\n//# sourceURL=' + target.path;
          } catch (transpileErr) {
            transpileErr.__reported = true;
            var errLine = transpileErr.loc ? transpileErr.loc.line : undefined;
            var errCol = transpileErr.loc ? transpileErr.loc.column : undefined;
            var cleanMsg = (transpileErr.message || 'Babel transform error').replace(/^unknown:\\s*/i, '');
            reportError('compile', target.path, cleanMsg, errLine, errCol, transpileErr.stack);
            throw transpileErr;
          }

          var factoryFn;
          try {
            factoryFn = new Function('require', 'module', 'exports', 'React', 'ReactDOM', transformed);
            moduleFactories[targetKey] = factoryFn;
          } catch (fnErr) {
            fnErr.__reported = true;
            reportError('compile', target.path, fnErr.message || 'Syntax error creating module factory', 1, 1, fnErr.stack);
            throw fnErr;
          }
        }

        var mod = { exports: {} };
        moduleCache[targetKey] = mod;

        var scopedRequire = function(subPath) {
          return customRequire(target.path, subPath);
        };

        try {
          moduleFactories[targetKey](scopedRequire, mod, mod.exports, window.React, window.ReactDOM);
        } catch (execErr) {
          execErr.__reported = true;
          var parsed = parseStack(execErr.stack);
          var errFile = parsed.file || target.path;
          reportError('runtime', errFile, execErr.message || String(execErr), parsed.line, parsed.column, execErr.stack);
          throw execErr;
        }

        return mod.exports;
      }

      // 7. Mount Entry Point
      try {
        var entryFile = findFile('/index.jsx') || findFile('/index.js');
        if (entryFile) {
          customRequire('/', entryFile.path);
        } else {
          var appFile = findFile('/App.jsx') || findFile('/App.js');
          if (appFile) {
            var appMod = customRequire('/', appFile.path);
            var AppComp = appMod.default || appMod;
            if (AppComp && window.ReactDOM) {
              if (window.ReactDOM.createRoot) {
                var root = window.ReactDOM.createRoot(document.getElementById('root'));
                root.render(window.React.createElement(AppComp));
              } else {
                window.ReactDOM.render(window.React.createElement(AppComp), document.getElementById('root'));
              }
            }
          } else {
            reportError('runner', '', 'Could not find /index.jsx or /App.jsx in project sources.');
            return;
          }
        }

        // Notify parent that preview initialized cleanly
        window.parent.postMessage({
          source: 'vibeforge-preview',
          type: 'ready',
          level: 'info'
        }, '*');
      } catch (mountErr) {
        if (!mountErr.__reported) {
          mountErr.__reported = true;
          var parsed = parseStack(mountErr.stack);
          var kind = parsed.file ? 'runtime' : 'runner';
          reportError(kind, parsed.file || '', mountErr.message || String(mountErr), parsed.line, parsed.column, mountErr.stack);
        }
      }
    })();
  </script>
</body>
</html>`;

  return html;
}
