import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';



function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    setIsLoggedIn(!!userId);
    setUsername(storedUsername || '');
  }, []);

  const handleLogout = async () => {
    //Call backend to destroy session
    await fetch('http://localhost:3000/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
    // Clear localStorage and update state
    localStorage.clear();
    setIsLoggedIn(false);
    setUsername('');
    navigate('/login');
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
          <Link to="/profile" className="profile-link">{username}</Link>
          <Link to="/profile">
            <img src="/assets/images/User Icon.png" alt="User Icon" className="user-icon" />
          </Link>
          <button className="btn logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      ) : (
        <div className="user-actions-logged-out">
          <Link to="/login" className="btn login-btn">Log in</Link>
          <Link to="/signup" className="btn signup-btn">Sign up</Link>
        </div>
      )}
    </header>
  );
}

export default Header;