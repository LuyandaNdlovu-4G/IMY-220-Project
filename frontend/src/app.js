import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SplashPage from './pages/SplashPage.js';
import HomePage from './pages/HomePage.js';
import ProjectsPage from './pages/ProjectsPage.js'; // Import the new component
import ProjectView from './pages/ProjectView.js';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/projects" element={<ProjectsPage />} /> {/* Corrected route */}
      <Route path="/projects/:id" element={<ProjectView />} />
    </Routes>
  );
}

export default App;