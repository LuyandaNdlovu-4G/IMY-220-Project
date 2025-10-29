import React, { useState } from 'react';
import AuthHeader from '../components/AuthHeader';

function AdminPromotionPage() {
  const [email, setEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/promote-to-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, adminKey })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        setEmail('');
        setAdminKey('');
      } else {
        setMessage(data.message || 'Failed to promote user.');
        setIsSuccess(false);
      }
    } catch (err) {
      setMessage('Server error. Please try again.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthHeader />
      <div className="auth-container">
        <div className="auth-form-card">
          <h2>Promote User to Admin</h2>
          <p style={{ color: '#A0A0A0', marginBottom: '1.5rem' }}>
            This is a temporary utility to promote users to admin role. 
            Use the admin key to promote your account.
          </p>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">User Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter email address to promote"
              />
            </div>

            <div className="form-group">
              <label htmlFor="adminKey">Admin Key:</label>
              <input
                type="password"
                id="adminKey"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
                placeholder="Enter admin promotion key"
              />
            </div>

            <button type="submit" className="btn auth-btn">
              Promote to Admin
            </button>
          </form>

          {message && (
            <div className={`message ${isSuccess ? 'success' : 'error'}`}>
              {message}
              {isSuccess && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  Please log out and log back in to see admin privileges.
                </div>
              )}
            </div>
          )}

          <div className="form-note" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#2A2A2A', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#3B82F6' }}>Instructions:</h4>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#A0A0A0' }}>
              <li>Enter your account email address</li>
              <li>Enter the admin key: <code style={{ color: '#E5E5E5' }}>admin123</code></li>
              <li>Click "Promote to Admin"</li>
              <li>Log out and log back in to access admin features</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPromotionPage;