import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext.js'; 
import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/RequireAuth.js';  
import SplashPage from './pages/SplashPage.js';
import HomePage from './pages/HomePage.js';
import ProjectsPage from './pages/ProjectsPage.js';
import ProjectView from './pages/ProjectView.js';
import ProfilePage from './pages/ProfilePage.js';
import FriendPage from './pages/FriendsPage.js';
import LoginPage from './pages/LoginPage.js';
import SignUpPage from './pages/SignUpPage.js';

function App() {

  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* Redirect logged-in users away from splash/login/signup */}
      <Route 
        path="/" 
        element={user ? <Navigate to="/home" replace /> : <SplashPage />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/home" replace /> : <LoginPage />} 
      />
      <Route 
        path="/signup" 
        element={user ? <Navigate to="/home" replace /> : <SignUpPage />} 
      />

      {/* Protected routes */}
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/projects" element={<RequireAuth><ProjectsPage /></RequireAuth>} />
      <Route path="/projects/:id" element={<RequireAuth><ProjectView /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/friends" element={<RequireAuth><FriendPage /></RequireAuth>} />
    </Routes>
  );
}

export default App;