import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function slugify(text) {
  return (text || 'prompttocode-project')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '') || 'prompttocode-project';
}

/**
 * Creates and downloads a ready-to-run ZIP archive containing all accepted project files.
 * For React projects, packages standard Vite layout (src/main.jsx, package.json, vite.config.js, index.html).
 * For Vanilla projects, packages standard files with instructions to open in browser.
 */
export async function exportProjectZip({ name, projectType = 'vanilla', files = {} }) {
  const fileEntries = Object.entries(files || {}).filter(([path]) => !path.startsWith('.'));
  if (fileEntries.length === 0) {
    throw new Error('No files found in the current project to export.');
  }

  const zip = new JSZip();
  const projectName = name?.trim() || 'Untitled Project';
  const projectSlug = slugify(projectName);

  if (projectType === 'react') {
    let customPackageJson = null;
    let customViteConfig = null;
    let hasMainEntry = false;
    const srcFiles = {};

    for (const [rawPath, content] of fileEntries) {
      const clean = rawPath.replace(/^\//, '');

      if (clean === 'package.json') {
        try {
          JSON.parse(content);
          customPackageJson = content;
        } catch {
          // Fallback to standard package.json
        }
        continue;
      }

      if (clean === 'vite.config.js' || clean === 'vite.config.ts') {
        customViteConfig = content;
        continue;
      }

      if (clean === 'index.html') {
        // Handled below for Vite root entry
        continue;
      }

      if (clean === 'index.jsx' || clean === 'index.js' || clean === 'src/main.jsx' || clean === 'src/main.js' || clean === 'src/index.jsx' || clean === 'src/index.js') {
        hasMainEntry = true;
        // Fix relative imports in main.jsx if needed (e.g. ./App -> ./App)
        srcFiles['src/main.jsx'] = content;
        continue;
      }

      // If file already starts with src/
      if (clean.startsWith('src/')) {
        srcFiles[clean] = content;
      } else {
        // Place other source files, components, and CSS inside src/
        srcFiles[`src/${clean}`] = content;
      }
    }

    // Add all processed source files
    for (const [p, c] of Object.entries(srcFiles)) {
      zip.file(p, c);
    }

    // If no main entry was present, generate standard src/main.jsx
    if (!hasMainEntry) {
      const hasCss = Object.keys(srcFiles).some((p) => p.endsWith('.css'));
      const cssImport = hasCss
        ? Object.keys(srcFiles).find((p) => p.endsWith('.css'))?.replace(/^src\//, './')
        : null;

      zip.file(
        'src/main.jsx',
        `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
${cssImport ? `import '${cssImport}';` : ''}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
      );
    }

    // package.json at root
    if (customPackageJson) {
      zip.file('package.json', customPackageJson);
    } else {
      zip.file(
        'package.json',
        JSON.stringify(
          {
            name: projectSlug,
            private: true,
            version: '0.1.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
              'lucide-react': '^1.16.0',
              clsx: '^2.1.1',
              'tailwind-merge': '^2.6.0',
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.3.4',
              vite: '^6.2.0',
            },
          },
          null,
          2
        )
      );
    }

    // vite.config.js at root
    if (customViteConfig) {
      zip.file('vite.config.js', customViteConfig);
    } else {
      zip.file(
        'vite.config.js',
        `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});
`
      );
    }

    // Root index.html for Vite
    zip.file(
      'index.html',
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
    );

    // README.md with Vite instructions
    zip.file(
      'README.md',
      `# ${projectName} (React + Vite)

Built with **PromptToCode** — *Describe it. Build it. Run it.*

## 🚀 Running Locally

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the local development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open the URL shown in your terminal (usually \`http://localhost:5173\`) in your browser.

## 📦 Building for Production

\`\`\`bash
npm run build
\`\`\`
`
    );
  } else {
    // Vanilla Project
    for (const [rawPath, content] of fileEntries) {
      const clean = rawPath.replace(/^\//, '');
      zip.file(clean, content);
    }

    // Ensure index.html exists
    if (!files['index.html'] && !files['/index.html']) {
      zip.file(
        'index.html',
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>${projectName}</h1>
    <script src="script.js"></script>
  </body>
</html>
`
      );
    }

    // README.md with Vanilla instructions
    zip.file(
      'README.md',
      `# ${projectName} (Vanilla Web)

Built with **PromptToCode** — *Describe it. Build it. Run it.*

## 🚀 Running Locally

Open \`index.html\` in your browser, or start a local static server:

\`\`\`bash
# Using Python
python3 -m http.server 3000

# Or using Node
npx serve
\`\`\`

Open \`http://localhost:3000\` in your browser.
`
    );
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const filename = `${projectSlug}.zip`;
  saveAs(zipBlob, filename);

  return { success: true, filename };
}
