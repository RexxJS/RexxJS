import React from 'react';
import ReactDOM from 'react-dom/client';
import SpreadsheetApp from './SpreadsheetApp';
import SpreadsheetModel from './spreadsheet-model';
import SpreadsheetRexxAdapter from './spreadsheet-rexx-adapter';
import SpreadsheetLoader from './spreadsheet-loader';
import '../spreadsheet-styles.css';

// Make models available globally for compatibility
if (typeof window !== 'undefined') {
  window.SpreadsheetModel = SpreadsheetModel;
  window.SpreadsheetRexxAdapter = SpreadsheetRexxAdapter;
  window.SpreadsheetLoader = SpreadsheetLoader;
}

// Wait for RexxJS to be available
async function initializeApp() {
  // RexxJS bundle should already be loaded via script tag in HTML
  // Wait a bit for it to initialize
  let attempts = 0;
  while (attempts < 50 && typeof window.RexxInterpreter === 'undefined' && typeof window.parse === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (typeof window.RexxInterpreter === 'undefined' || typeof window.parse === 'undefined') {
    console.error('RexxJS not available after waiting');
    alert('RexxJS bundle failed to load. Please ensure the bundle is built and available.');
    return;
  }

  console.log('RexxJS is ready');

  // Initialize sheet name from hash
  const hash = window.location.hash.substring(1);
  if (!hash) {
    window.location.hash = 'Sheet1';
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <SpreadsheetApp />
  );
}

// Start the app
initializeApp().catch(error => {
  console.error('Failed to initialize app:', error);
});
