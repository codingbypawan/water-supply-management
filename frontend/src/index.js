import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import { registerServiceWorker, initInstallPrompt, updateManifest } from './utils/pwa';

// Register service worker for PWA support
registerServiceWorker();

// Capture install prompt event early
initInstallPrompt();

// Set initial dynamic manifest (domain-based)
updateManifest();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
