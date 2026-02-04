import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Prevent dragEvent reference errors in Electron
// Some Chromium builds reference dragEvent in the global scope
// Define a safe placeholder to avoid console errors
// @ts-ignore
if (typeof (window as any).dragEvent === 'undefined') {
  Object.defineProperty(window, 'dragEvent', {
    value: null,
    writable: true,
    configurable: true,
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);