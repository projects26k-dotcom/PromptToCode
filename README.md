# VibeForge

**Describe it. Forge it. Run it.**

VibeForge is a browser-based AI code editor. Write a prompt, and the AI builds your project. It is free to use with your own Gemini API key, and everything runs in your browser with no backend.

## Features

- **Monaco editor** with multi-file tabs, a file tree, and syntax highlighting
- **AI chat with Gemini** (streaming) that creates and edits multiple files
- **Diff-first review**: every AI change is a pending diff you can edit, accept, or reject
- **Live preview** for HTML/CSS/JS and React, with a console panel
- **Auto-fix**: one click sends a preview error to the AI for a proposed fix
- **Version timeline**: snapshots before and after each change, with preview and restore
- **Screenshot to code**: attach an image and get matching code
- **Auto images**: related pictures are added automatically
- **Learn mode**: the AI explains what it built, plus a short quiz
- **Plan mode**: review and edit the AI's plan before it writes code
- **Multiple projects** saved in your browser (IndexedDB)
- **Download as ZIP**

## Tech stack

React, Vite, Tailwind CSS, Monaco Editor, Zustand, Dexie (IndexedDB), JSZip, Google Gemini API

## Getting started

```bash
git clone https://github.com/<your-username>/vibeforge.git
cd vibeforge
npm install
npm run dev
```

Open http://localhost:5173.

## Add your API key

1. Get a free key at [Google AI Studio](https://aistudio.google.com).
2. Open **Settings** in VibeForge and paste the key.

Your key is stored only in your browser (localStorage) and is sent only to Google's API.

## Notes

- The free Gemini tier has rate limits. If you see a 429 error, wait a minute and retry.
- Generated apps run in a sandboxed iframe, so features like `localStorage` may be limited in the preview.

## Roadmap

- Deploy to Vercel
- Keyboard shortcuts and polish
- More project types (TypeScript, Python)

## License

MIT
