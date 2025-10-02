import React, { createContext, useState, useEffect } from "react";
import api from "../api";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-login if token/userId exists
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      api.get(`/users/${userId}`)
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("userId");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // LOGIN
  const login = async ({ email, password }) => {
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("userId", res.data.user.id);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Login failed");
    }
  };

  // SIGNUP
  const signup = async ({ username, email, password }) => {
    try {
      const res = await api.post("/signup", { username, email, password });
      localStorage.setItem("userId", res.data.userId);
      setUser({ id: res.data.userId, username, email });
      return { id: res.data.userId, username, email };
    } catch (err) {
      throw new Error(err.response?.data?.message || "Signup failed");
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("userId");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
