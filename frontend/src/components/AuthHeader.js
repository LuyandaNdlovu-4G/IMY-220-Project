import React from 'react';
import { Link } from 'react-router-dom';

function AuthHeader() {
  return (
    <header className="header auth-header">
      <div className="left-group">
        <Link to="/" className="logo">
          <img src="/assets/images/Code Cave Logo.png" alt="Code Cave Logo" className="logo-img" />
        </Link>
        <div className="nav-links">
          <ul>
            <li className="nav-item"><Link to="/home">Home</Link></li>
            <li className="nav-item"><Link to="/projects">Projects</Link></li>
            <li className="nav-item"><Link to="/friends">Friends</Link></li>
          </ul>
        </div>
      </div>
      <div className="user-actions-logged-out">
        <Link to="/login" className="btn login-btn">Log in</Link>
        <Link to="/signup" className="btn signup-btn">Sign up</Link>
      </div>
    </header>
  );
}

export default AuthHeader;