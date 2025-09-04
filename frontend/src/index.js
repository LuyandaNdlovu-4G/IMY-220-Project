import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app.js';
import './css/style.css';

// Find the root element in the HTML file
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Render your App component wrapped in BrowserRouter
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);