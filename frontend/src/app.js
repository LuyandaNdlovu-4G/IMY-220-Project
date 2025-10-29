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
import AdminDashboard from './pages/AdminDashboard.js';


function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage key="splash" />} />
      <Route path="/home" element={<HomePage key="home" />} />
      <Route path="/projects" element={<ProjectsPage key="projects" />} />
      <Route path="/projects/:id" element={<ProjectView key="project-view" />} />
      <Route path="/profile/:userId" element={<ProfilePage key="profile-user" />} />
      <Route path="/profile" element={<ProfilePage key="profile-self" />} />
      <Route path="/friends" element={<FriendPage key="friends" />} />
      <Route path="/login" element={<LoginPage key="login" />} />
      <Route path="/signup" element={<SignUpPage key="signup" />} />
      <Route path="/admin" element={<AdminDashboard key="admin" />} />
    </Routes>
  );
}

export default App;