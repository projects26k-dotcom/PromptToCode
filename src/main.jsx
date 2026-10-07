import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { runMigration } from './lib/migration';
import ClerkAuthProvider from './components/ClerkAuthProvider';

// Run one-time legacy data migration
runMigration();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkAuthProvider>
      <App />
    </ClerkAuthProvider>
  </React.StrictMode>
);

