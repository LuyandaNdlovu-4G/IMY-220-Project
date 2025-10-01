import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      // Fetch user data from backend
      fetch(`/api/users/${userId}`)
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setLoading(false);
        })
        .catch(() => {
          // If fetch fails, clear localStorage
          localStorage.removeItem('userId');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem('userId', userData.id);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};