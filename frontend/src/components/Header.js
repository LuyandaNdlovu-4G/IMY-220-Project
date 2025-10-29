import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchResults from './SearchResults';



function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');
    setIsLoggedIn(!!userId);
    setUsername(storedUsername || '');
    setIsAdmin(userRole === 'admin');
    
    // Fetch user profile data if logged in
    if (userId) {
      fetchUserProfile(userId);
    }
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/profile`, {
        headers: {
          'user-id': userId
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.profile && userData.profile.details && userData.profile.details.avatar) {
          setUserAvatar(userData.profile.details.avatar);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = async () => {
    //Call backend to destroy session
    await fetch('http://localhost:3001/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
    // Clear localStorage and update state
    localStorage.clear();
    setIsLoggedIn(false);
    setUsername('');
    setUserAvatar('');
    navigate('/login');
  };

  const performSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query.trim())}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowResults(true);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults(null);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms delay
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      performSearch(searchQuery);
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSearchQuery('');
      setSearchResults(null);
    }
  };

  const handleSearchFocus = () => {
    if (searchResults && (searchResults.users?.length > 0 || searchResults.projects?.length > 0)) {
      setShowResults(true);
    }
  };

  const handleCloseSearch = () => {
    setShowResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container') && !event.target.closest('.search-results-dropdown')) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
            {isAdmin && <li><Link to="/admin" className="admin-link">Admin</Link></li>}
          </ul>
        </nav>
      </div>
      {isLoggedIn ? (
        <div className="user-actions-logged-in">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search users, projects..." 
              className="search-input" 
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={handleSearchFocus}
            />
            {isSearching && (
              <div className="search-loading">
                <span className="loading-spinner">⟳</span>
              </div>
            )}
            <SearchResults
              searchResults={searchResults}
              isVisible={showResults}
              onClose={handleCloseSearch}
              searchQuery={searchQuery}
            />
          </div>
          <Link to="/profile" className="profile-link">{username}</Link>
          <Link to="/profile">
            <img 
              src={userAvatar || "/assets/images/User Icon.png"} 
              alt="User Icon" 
              className="user-icon" 
            />
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