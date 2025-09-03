import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './app';

// Find the root element in the HTML file
const rootElement = document.getElementById('root');

// Wrap the App component with BrowserRouter to enable client-side routing.
// This allows components within the App to use hooks like 'useParams'.
ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  rootElement
);