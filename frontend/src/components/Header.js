import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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
      {user ? (
        <div className="user-actions-logged-in">
          <input type="text" placeholder="Search..." className="search-input" />
          <Link to="/profile" className="profile-link">{user.username}</Link>
          <Link to="/profile">
            <img src="/assets/images/User Icon.png" alt="User Icon" className="user-icon" />
          </Link>
          <button className="btn logout-btn" onClick={handleLogout}>Log Out</button>
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