import React from 'react';
import AuthHeader from '../components/AuthHeader';

function SignUpPage() {
  return (
    <div className="auth-page">
      <AuthHeader />
      <div className="auth-container">
        <div className="auth-form-card">
          <h2>Create your account</h2>
          <form className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input type="text" id="username" placeholder="Choose a username" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input type="password" id="password" placeholder="Choose a password" />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password:</label>
              <input type="password" id="confirm-password" placeholder="Confirm your password" />
            </div>
            <button type="submit" className="btn auth-btn">Sign up</button>
          </form>
          <p className="form-link">Already have an account? <a href="/login">Log in</a></p>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;