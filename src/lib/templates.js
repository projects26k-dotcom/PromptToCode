/**
 * Project Starter Templates (Vanilla & React)
 */

export const TEMPLATES = [
  // Vanilla Templates
  {
    id: 'blank-vanilla',
    type: 'vanilla',
    name: 'Blank HTML/CSS/JS',
    description: 'Clean starter with index.html, style.css, and script.js',
    icon: 'FileCode',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello PromptToCode</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div class="container">
      <div class="card">
        <h1>✨ Hello, PromptToCode!</h1>
        <p class="tagline">Describe it. Build it. Run it.</p>
        <button id="action-btn">Click for Magic</button>
        <div id="output"></div>
      </div>
    </div>
    <script src="script.js"></script>
  </body>
</html>`,
      'style.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: #f8fafc;
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.container {
  padding: 2rem;
}

.card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 1.5rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-width: 480px;
}

h1 {
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #818cf8, #c084fc);
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 0.75rem;
}

.tagline {
  color: #94a3b8;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

button {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  border: none;
  padding: 0.75rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 9999px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.5);
}

#output {
  margin-top: 1.5rem;
  font-weight: 500;
  color: #38bdf8;
  min-height: 1.5rem;
}`,
      'script.js': `// Welcome to PromptToCode!
const btn = document.getElementById('action-btn');
const output = document.getElementById('output');

const quotes = [
  '⚡ Code crafted with AI precision.',
  '🚀 Building the future one prompt at a time.',
  '✨ Describe it. Build it. Run it.',
  '💡 From imagination to running code instantly.'
];

let index = 0;

btn?.addEventListener('click', () => {
  output.textContent = quotes[index % quotes.length];
  index++;
});`,
    },
    openTabs: ['index.html', 'style.css', 'script.js'],
    activeFile: 'index.html',
  },

  {
    id: 'landing-vanilla',
    type: 'vanilla',
    name: 'Landing Page Starter',
    description: 'Modern SaaS dark landing page with hero, features, and pricing',
    icon: 'LayoutTemplate',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus — Next-Gen AI Workflow</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="navbar">
    <div class="logo">⚡ NexusAI</div>
    <nav>
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <button class="btn-primary">Get Started</button>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="badge">🚀 v2.0 Released</div>
      <h1>Supercharge Your Workflow With Intelligent AI</h1>
      <p>Transform raw ideas into running software in seconds with automated code generation and instant deployment.</p>
      <div class="hero-actions">
        <button class="btn-primary">Start Free Trial</button>
        <button class="btn-secondary">Watch Demo</button>
      </div>
    </section>

    <section id="features" class="features">
      <h2>Engineered For Pure Speed</h2>
      <div class="grid">
        <div class="card">
          <div class="icon">⚡</div>
          <h3>Lightning Fast</h3>
          <p>Instant code previews and zero build step compilation directly in your browser.</p>
        </div>
        <div class="card">
          <div class="icon">🔒</div>
          <h3>Privacy First</h3>
          <p>Your keys and code stay strictly local to your machine.</p>
        </div>
        <div class="card">
          <div class="icon">🪄</div>
          <h3>AI Assisted</h3>
          <p>Smart diff reviews and real-time generation powered by Google Gemini.</p>
        </div>
      </div>
    </section>
  </main>
  <script src="script.js"></script>
</body>
</html>`,
      'style.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #090d16;
  color: #f1f5f9;
  line-height: 1.6;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  border-bottom: 1px solid #1e293b;
}

.logo {
  font-weight: 800;
  font-size: 1.25rem;
  color: #818cf8;
}

nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

nav a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

nav a:hover {
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid #334155;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.hero {
  text-align: center;
  padding: 6rem 2rem 4rem;
  max-width: 800px;
  margin: 0 auto;
}

.badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 9999px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  font-size: 0.8rem;
  margin-bottom: 1.5rem;
}

.hero h1 {
  font-size: 3rem;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  background: linear-gradient(to right, #ffffff, #94a3b8);
  -webkit-background-clip: text;
  color: transparent;
}

.hero p {
  font-size: 1.15rem;
  color: #94a3b8;
  margin-bottom: 2.5rem;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.features {
  padding: 4rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}

.features h2 {
  font-size: 2rem;
  margin-bottom: 3rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.card {
  background: #0f172a;
  border: 1px solid #1e293b;
  padding: 2rem;
  border-radius: 1rem;
  text-align: left;
}

.icon {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.card h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.card p {
  color: #94a3b8;
  font-size: 0.9rem;
}`,
      'script.js': `// Landing page interaction
console.log('NexusAI landing page loaded successfully!');

document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    console.log('Action triggered:', e.target.textContent);
  });
});`,
    },
    openTabs: ['index.html', 'style.css', 'script.js'],
    activeFile: 'index.html',
  },

  {
    id: 'todo-vanilla',
    type: 'vanilla',
    name: 'Todo App Starter',
    description: 'Interactive Task Manager with filtering, local storage, and completion tracking',
    icon: 'CheckSquare',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VibeTasks — Modern Todo</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-container">
    <header>
      <h1>✨ VibeTasks</h1>
      <p id="task-count">0 tasks left</p>
    </header>

    <form id="todo-form">
      <input type="text" id="todo-input" placeholder="What needs to be done?" autocomplete="off" required>
      <button type="submit" id="add-btn">Add Task</button>
    </form>

    <div class="filters">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="active">Active</button>
      <button class="filter-btn" data-filter="completed">Completed</button>
    </div>

    <ul id="todo-list"></ul>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      'style.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0b0f19;
  color: #f8fafc;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
}

.app-container {
  width: 100%;
  max-width: 480px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  height: fit-content;
}

header {
  margin-bottom: 1.5rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #818cf8;
}

#task-count {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

input[type="text"] {
  flex: 1;
  background: #1f2937;
  border: 1px solid #374151;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  outline: none;
}

input[type="text"]:focus {
  border-color: #6366f1;
}

#add-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 1rem;
}

.filter-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.85rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.filter-btn.active {
  background: #1f2937;
  color: #818cf8;
  font-weight: 600;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1f2937;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s;
}

li.completed span {
  text-decoration: line-through;
  color: #64748b;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem 0.5rem;
}`,
      'script.js': `// Todo App with LocalStorage
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const count = document.getElementById('task-count');
const filterBtns = document.querySelectorAll('.filter-btn');

let todos = JSON.parse(localStorage.getItem('prompttocode_todos') || localStorage.getItem('vibeforge_todos') || '[]');
let currentFilter = 'all';

function saveAndRender() {
  localStorage.setItem('prompttocode_todos', JSON.stringify(todos));
  render();
}

function render() {
  list.innerHTML = '';
  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  filtered.forEach((t, i) => {
    const li = document.createElement('li');
    if (t.completed) li.classList.add('completed');
    li.innerHTML = \`
      <span style="cursor: pointer;">\${t.text}</span>
      <button class="delete-btn" data-id="\${t.id}">✕</button>
    \`;
    li.querySelector('span').onclick = () => {
      t.completed = !t.completed;
      saveAndRender();
    };
    li.querySelector('.delete-btn').onclick = (e) => {
      e.stopPropagation();
      todos = todos.filter(item => item.id !== t.id);
      saveAndRender();
    };
    list.appendChild(li);
  });

  const activeCount = todos.filter(t => !t.completed).length;
  count.textContent = \`\${activeCount} task\${activeCount === 1 ? '' : 's'} left\`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    todos.push({ id: Date.now(), text, completed: false });
    input.value = '';
    saveAndRender();
  }
});

filterBtns.forEach(btn => {
  btn.onclick = () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  };
});

render();
console.log('Todo app initialized with', todos.length, 'tasks.');`,
    },
    openTabs: ['index.html', 'style.css', 'script.js'],
    activeFile: 'index.html',
  },

  // React Templates
  {
    id: 'blank-react',
    type: 'react',
    name: 'Blank React',
    description: 'Clean React starter with components, hooks, and Sandpack live execution',
    icon: 'Atom',
    files: {
      '/App.jsx': `import React, { useState } from 'react';
import './styles.css';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <div className="card">
        <h1>✨ Hello, React PromptToCode!</h1>
        <p className="tagline">Describe it. Build it. Run it.</p>
        <button onClick={() => setCount((c) => c + 1)}>
          Count is {count}
        </button>
        <div className="output">
          {count > 0 && \`⚡ React state updated \${count} time\${count > 1 ? 's' : ''}!\`}
        </div>
      </div>
    </div>
  );
}`,
      '/index.jsx': `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      '/styles.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: #f8fafc;
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.container {
  padding: 2rem;
}

.card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 1.5rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-width: 480px;
}

h1 {
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #818cf8, #c084fc);
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 0.75rem;
}

.tagline {
  color: #94a3b8;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

button {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  border: none;
  padding: 0.75rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 9999px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.5);
}

.output {
  margin-top: 1.5rem;
  font-weight: 500;
  color: #38bdf8;
  min-height: 1.5rem;
}`,
      '/public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React PromptToCode</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      '/package.json': `{
  "name": "react-prompttocode",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}`,
    },
    openTabs: ['/App.jsx', '/styles.css', '/index.jsx'],
    activeFile: '/App.jsx',
  },

  {
    id: 'todo-react',
    type: 'react',
    name: 'React Todo Starter',
    description: 'Interactive React stateful Todo app with filters, animated items, and local storage',
    icon: 'CheckSquare',
    files: {
      '/App.jsx': `import React, { useState, useEffect } from 'react';
import './styles.css';

export default function App() {
  const [todos, setTodos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('react_vibe_todos') || '[]');
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('react_vibe_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input.trim(), completed: false }]);
    setInput('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter(t => !t.completed).length;

  return (
    <div className="app-container">
      <header>
        <h1>⚡ React VibeTasks</h1>
        <p className="task-count">{activeCount} task{activeCount === 1 ? '' : 's'} remaining</p>
      </header>

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <div className="filters">
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'active' : ''}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <ul className="todo-list">
        {filtered.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)} className="del-btn">✕</button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="empty">No tasks in this view</li>
        )}
      </ul>
    </div>
  );
}`,
      '/index.jsx': `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      '/styles.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #090d16;
  color: #f8fafc;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
}

.app-container {
  width: 100%;
  max-width: 460px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  height: fit-content;
}

header {
  margin-bottom: 1.5rem;
}

h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #818cf8;
}

.task-count {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.todo-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.todo-form input {
  flex: 1;
  background: #1f2937;
  border: 1px solid #374151;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  outline: none;
}

.todo-form input:focus {
  border-color: #6366f1;
}

.todo-form button {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 1rem;
}

.filters button {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.85rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.filters button.active {
  background: #1f2937;
  color: #818cf8;
  font-weight: 600;
}

.todo-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.todo-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1f2937;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
}

.todo-list li.completed span {
  text-decoration: line-through;
  color: #64748b;
}

.todo-list li.empty {
  color: #64748b;
  font-size: 0.85rem;
  justify-content: center;
  background: transparent;
  border: 1px dashed #1f2937;
}

.del-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
}`,
      '/public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React VibeTasks</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      '/package.json': `{
  "name": "react-vibetasks",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}`,
    },
    openTabs: ['/App.jsx', '/styles.css', '/index.jsx'],
    activeFile: '/App.jsx',
  },
];
