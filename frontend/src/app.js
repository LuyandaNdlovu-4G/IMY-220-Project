import React from 'react';
import './css/style.css';

// This is the main component of your application.
// You can build out your entire user interface here.
function App() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '600px',
      margin: '2rem'
    }}>
      <h1>Hello, React World!</h1>
      <p style={{ color: '#4a5568' }}>This is a simple React component rendered with Webpack and Babel.</p>
    </div>
  );
}

export default App;
