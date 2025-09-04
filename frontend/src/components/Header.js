import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <header className="header">
      <div className="left-group">
        <div className="logo">
          <img src="/assets/images/Code Cave Logo.png" alt="Code Cave Logo" className="logo-img" />
        </div>
        <nav className="nav-links">
          <ul>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li><Link to="/friends">Friends</Link></li>
          </ul>
        </nav>
      </div>
      {isLoggedIn ? (
        <div className="user-actions-logged-in">
          <input type="text" placeholder="Search..." className="search-input" />
          <Link to="/profile" className="profile-link">LuyandaNdlovu-4G</Link>
          <button onClick={handleLogout} className="btn sign-out-btn">sign out</button>
        </div>
      ) : (
        <div className="user-actions-logged-out">
          <Link to="/login" className="btn login-btn">login</Link>
          <Link to="/signup" className="btn signup-btn">sign up</Link>
        </div>
      )}
    </header>
  );
}

export default Header;