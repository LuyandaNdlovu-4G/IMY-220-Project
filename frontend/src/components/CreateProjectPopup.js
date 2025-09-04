import React, { useState } from 'react';

function CreateProjectPopup({ onClose, onCreate }) {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (projectName.trim() === '') {
      setError('Project name is required.');
      return;
    }
    onCreate(projectName);
    setProjectName('');
    setError('');
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <div className="popup-header">
          <h2>Create New Project</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="popup-form">
          <div className="form-group">
            <label htmlFor="projectName">Project Name</label>
            <input
              type="text"
              id="projectName"
              placeholder="e.g., My First App"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="popup-actions">
            <button type="button" onClick={onClose} className="btn cancel-btn">Cancel</button>
            <button type="submit" className="btn create-btn">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectPopup;