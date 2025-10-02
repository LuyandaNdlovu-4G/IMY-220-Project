import React, { useState, useContext } from 'react';
import AuthHeader from '../components/AuthHeader';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; 

function SignUpPage() {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  // State for form inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for validation errors
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleValidation = () => {
    let isValid = true;
    
    // Reset all errors
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Username validation
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters long.');
      isValid = false;
    }
    
    // Email validation
    if (!email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleValidation()) return;

    try {
      await signup({ username, email, password });
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
          <h2>Create your account</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              {usernameError && <span className="error-message">{usernameError}</span>}
            </div>
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
              {emailError && <span className="error-message">{emailError}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {passwordError && <span className="error-message">{passwordError}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password:</label>
              <input
                type="password"
                id="confirm-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPasswordError && <span className="error-message">{confirmPasswordError}</span>}
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