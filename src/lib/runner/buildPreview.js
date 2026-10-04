/**
 * Safe argument serializer for the preview console bridge.
 * Handles circular references, DOM elements, Errors, Functions, Symbols, and BigInt.
 */
function serializeArg(arg) {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
  if (typeof arg === 'bigint') return `${arg}n`;
  if (typeof arg === 'symbol') return arg.toString();
  if (typeof arg === 'function') return `[Function: ${arg.name || 'anonymous'}]`;

  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}${arg.stack ? '\n' + arg.stack : ''}`;
  }

  if (typeof HTMLElement !== 'undefined' && arg instanceof HTMLElement) {
    return arg.outerHTML ? arg.outerHTML.slice(0, 300) : '<HTMLElement>';
  }

  try {
    const seen = new WeakSet();
    return JSON.stringify(arg, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
      if (typeof value === 'symbol') return value.toString();
      if (typeof value === 'bigint') return `${value}n`;
      return value;
    }, 2);
  } catch (err) {
    return String(arg);
  }
}

/**
 * Console and error capture script injected as the first element inside the iframe.
 */
const CONSOLE_BRIDGE_SCRIPT = `
<script>
(function() {
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
        source: 'prompttocode-preview',
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

  window.addEventListener('error', function(e) {
    if (e.target && e.target.tagName === 'IMG') return;
    var errMsg = (e.error ? formatArg(e.error) : e.message) || 'Uncaught Runtime Error';
    var stack = e.error && e.error.stack ? e.error.stack : '';
    var file = e.filename || '';
    if (file && (file.indexOf('/') >= 0 || file.indexOf('\\') >= 0)) {
      var parts = file.split(/[\\/]/);
      file = parts[parts.length - 1];
    }
    if (!file || file === 'srcdoc' || file.startsWith('data:') || file.startsWith('blob:')) {
      file = 'script.js';
    }

    window.parent.postMessage({
      source: 'prompttocode-preview',
      type: 'error',
      kind: file ? 'runtime' : 'runner',
      level: 'error',
      message: errMsg,
      file: file,
      line: e.lineno,
      column: e.colno,
      stack: stack
    }, '*');
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
    var reason = e.reason;
    var errMsg = 'Unhandled Promise Rejection: ' + formatArg(reason);
    var stack = reason && reason.stack ? reason.stack : '';

    window.parent.postMessage({
      source: 'prompttocode-preview',
      type: 'error',
      kind: 'runtime',
      level: 'error',
      message: errMsg,
      file: 'script.js',
      line: undefined,
      column: undefined,
      stack: stack
    }, '*');
  });
})();
</script>
`;

/**
 * Builds a single standalone HTML string for the iframe srcdoc by inlining
 * local CSS and JS files and injecting the console bridge.
 */
export function buildPreviewHtml(files = {}) {
  let html = files['index.html'];

  if (!html || typeof html !== 'string' || !html.trim()) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #090d16;
      color: #94a3b8;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 2rem;
      box-sizing: border-box;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      padding: 2.5rem;
      border-radius: 1rem;
      max-width: 400px;
    }
    h2 { color: #f1f5f9; margin-top: 0; font-size: 1.25rem; }
    p { font-size: 0.875rem; line-height: 1.5; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <h2>📄 No index.html Found</h2>
    <p>Create an <code>index.html</code> file in the explorer to see the live preview.</p>
  </div>
</body>
</html>`;
  }

  // 1. Replace local <link rel="stylesheet" href="..."> with inline <style>
  html = html.replace(/<link\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi, (match, before, href, after) => {
    // Check if it's a stylesheet
    const combined = `${before} ${after}`;
    if (!combined.includes('stylesheet') && !match.includes('rel="stylesheet"') && !match.includes("rel='stylesheet'")) {
      return match;
    }

    // Leave external links untouched
    if (/^(https?:|\/\/|data:)/i.test(href)) {
      return match;
    }

    const cleanPath = href.replace(/^\.?\//, '');
    if (cleanPath in files) {
      return `<style data-file="${cleanPath}">\n${files[cleanPath]}\n</style>`;
    }
    return match;
  });

  // 2. Replace local <script src="..."></script> with inline <script>
  html = html.replace(/<script\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>\s*<\/script>/gi, (match, before, src, after) => {
    // Leave external links untouched
    if (/^(https?:|\/\/|data:)/i.test(src)) {
      return match;
    }

    const cleanPath = src.replace(/^\.?\//, '');
    if (cleanPath in files) {
      return `<script data-file="${cleanPath}">\n${files[cleanPath]}\n</script>`;
    }
    return match;
  });

  // 3. Inject the console bridge script at the very top of <head>, or at start of document
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (match) => `${match}\n${CONSOLE_BRIDGE_SCRIPT}`);
  } else if (/<html[^>]*>/i.test(html)) {
    html = html.replace(/<html[^>]*>/i, (match) => `${match}\n<head>${CONSOLE_BRIDGE_SCRIPT}</head>`);
  } else {
    html = `${CONSOLE_BRIDGE_SCRIPT}\n${html}`;
  }

  // 4. Inject ready event at the bottom of the body
  const READY_SCRIPT = `<script>try{window.parent.postMessage({source:'prompttocode-preview',type:'ready'},'*');}catch(e){}</script>`;
  if (/<\/body[^>]*>/i.test(html)) {
    html = html.replace(/<\/body[^>]*>/i, (match) => `${READY_SCRIPT}\n${match}`);
  } else {
    html = `${html}\n${READY_SCRIPT}`;
  }

  return html;
}
