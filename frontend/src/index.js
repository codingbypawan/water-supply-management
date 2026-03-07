import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import { registerServiceWorker, initInstallPrompt, updateManifest } from './utils/pwa';

// Only register service worker in production to avoid dev server conflicts
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
  updateManifest();
}

// Capture install prompt event early
initInstallPrompt();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
