import React from 'react';
import AuthHeader from '../components/AuthHeader';

function LoginPage() {
  return (
    <div className="auth-page">
      <AuthHeader />
      <div className="auth-container">
        <div className="auth-form-card">
          <h2>Log in to your account</h2>
          <form className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input type="text" id="username" placeholder="Enter your username" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input type="password" id="password" placeholder="Enter your password" />
            </div>
            <button type="submit" className="btn auth-btn">Log in</button>
          </form>
          <p className="form-link">Don't have an account? <a href="/signup">Sign up</a></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;