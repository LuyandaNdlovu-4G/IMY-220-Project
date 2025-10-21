import React, { useState } from 'react';

function AddMemberPopup({ onClose, onAddMember, projectId }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          role: role
        })
      });

      const data = await response.json();

      if (response.ok) {
        onAddMember(data.member);
        onClose();
      } else {
        setError(data.message || 'Failed to add member');
      }
    } catch (error) {
      setError('An error occurred while adding the member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <div className="popup-header">
          <h3>Add Member</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="popup-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Member Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user's email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role:</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="collaborator">Collaborator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="popup-actions">
            <button 
              type="submit" 
              className="btn save-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Member'}
            </button>
            <button 
              type="button" 
              className="btn cancel-btn" 
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMemberPopup;