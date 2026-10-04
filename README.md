# PromptToCode

> **Describe it. Build it. Run it.**  
> Free, in-browser AI coding IDE. Turn natural language prompts and UI mockups into full-stack Vanilla and React applications with live previews, diff reviews, auto-fix, version timeline, and local ZIP export. Bring your own Gemini API key.

🌐 **Live Demo**: [https://prompttocode.vercel.app/](https://prompttocode.vercel.app/)

---

## ✨ Features

- ⚡ **Gemini-Powered AI Generator**: Stream and forge web applications directly from natural language prompts using Google's fastest Gemini models.
- 💻 **Monaco Code Editor**: Professional, VS Code-grade in-browser editor with full syntax highlighting, bracket matching, multi-file tabs, and keyboard navigation.
- 🚀 **Real-Time Live Previews**: Instant multi-file preview runner supporting both Vanilla HTML/CSS/JS and React component hierarchies with Tailwind CSS and Lucide icons.
- 🔍 **Diff-First Safety**: Side-by-side Monaco diff inspection allowing you to review, accept, or reject proposed code changes before applying them to your project.
- 🛠️ **Auto-Fix with AI**: One-click and automated runtime error capture and attribution that feeds preview exceptions directly back to the AI for instant repair.
- ⏱️ **Version Timeline & Snapshots**: Automated snapshot tracking across project milestones with side-by-side diff comparisons and instant point-in-time restoration.
- 🖼️ **Image Mockups & Sketches**: Drag-and-drop or paste screenshots, wireframes, and design mockups for multimodal image-to-code generation.
- 🎨 **Contextual Image Generation**: Automatic placeholder photo generation using Pollinations AI matching layout dimensions and topics.
- 🎓 **Interactive Learn Mode**: Beginner and intermediate pedagogical explanations, key architecture concepts, and 3-question quizzes.
- 📋 **Plan Mode (Two-Phase Flow)**: Request, edit, and approve implementation plans, file changes, and steps before the AI writes code.
- 📦 **One-Click Local ZIP Export**: Download your project as a clean, ready-to-run ZIP with local Vite configuration for React and standalone HTML for Vanilla.
- 🔒 **100% Private & In-Browser**: All projects, chats, snapshots, and API keys remain strictly on your device in IndexedDB and localStorage.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/prompttocode.git
cd prompttocode
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open `http://localhost:5173` in your browser.

5. Open **Settings** (gear icon in the top right), enter your [Google Gemini API Key](https://aistudio.google.com/app/apikey), and start creating!

---

## 📦 Production Build

```bash
npm run build
npm run preview
```

---

## 📄 License

MIT License. Open source and free to use.
