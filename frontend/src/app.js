import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SplashPage from './pages/SplashPage.js';
import HomePage from './pages/HomePage.js';
import ProjectsPage from './pages/ProjectsPage.js';
import ProjectView from './pages/ProjectView.js';
import ProfilePage from './pages/ProfilePage.js';
import FriendPage from './pages/FriendsPage.js';
import LoginPage from './pages/LoginPage.js';
import SignUpPage from './pages/SignUpPage.js';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectView />} />
      <Route path="/profile/:userId" element={<ProfilePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/friends" element={<FriendPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
    </Routes>
  );
}

export default App;