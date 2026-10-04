import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { runMigration } from './lib/migration';

// Run one-time legacy data migration
runMigration();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
