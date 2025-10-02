import React, { useState, useContext } from "react";
import AuthHeader from "../components/AuthHeader";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate("/home");
    } catch (err) {
      alert(err.message);
    }
  };


  return (
    <div className="auth-page">
      <AuthHeader />
      <div className="auth-container">
        <div className="auth-form-card">
          <h2>Log in to your account</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn auth-btn">
              Log in
            </button>
          </form>
          <p className="form-link">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
