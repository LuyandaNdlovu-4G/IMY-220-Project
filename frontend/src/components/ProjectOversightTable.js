import React, { useState } from 'react';

function ProjectOversightTable({ projects, onProjectDelete, onProjectEdit }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    projectName: '',
    description: '',
    type: '',
    hashtags: []
  });
  
  const handleDeleteProject = (project) => {
    if (window.confirm(`Are you sure you want to permanently delete project "${project.projectName}"? This action cannot be undone.`)) {
      onProjectDelete(project._id);
    }
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setEditForm({
      projectName: project.projectName,
      description: project.description || '',
      type: project.type,
      hashtags: project.hashtags || []
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = () => {
    if (!editForm.projectName.trim()) {
      alert('Project name is required');
      return;
    }

    onProjectEdit(selectedProject._id, editForm);
    setShowEditModal(false);
    setSelectedProject(null);
    setEditForm({ projectName: '', description: '', type: '', hashtags: [] });
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedProject(null);
    setEditForm({ projectName: '', description: '', type: '', hashtags: [] });
  };

  const handleHashtagsChange = (e) => {
    const value = e.target.value;
    const hashtagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setEditForm({...editForm, hashtags: hashtagsArray});
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="project-oversight">
      <h2>Project Oversight</h2>
      
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Owner</th>
              <th>Type</th>
              <th>Members</th>
              <th>Files</th>
              <th>Created</th>
              <th>Version</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project._id}>
                <td>
                  <div className="project-info">
                    <strong>{project.projectName}</strong>
                    {project.description && (
                      <div className="project-description">
                        {project.description.substring(0, 50)}
                        {project.description.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="owner-info">
                    <div>{project.owner?.username}</div>
                    <div className="owner-email">{project.owner?.email}</div>
                  </div>
                </td>
                <td>
                  <span className="type-badge">
                    {project.type}
                  </span>
                </td>
                <td>{project.memberCount}</td>
                <td>{project.fileCount}</td>
                <td>{formatDate(project.createdAt)}</td>
                <td>{project.version || 'v1.0.0'}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn action-btn edit"
                      onClick={() => handleEditProject(project)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn action-btn delete"
                      onClick={() => handleDeleteProject(project)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {projects.length === 0 && (
          <div className="empty-state">
            <p>No projects found.</p>
          </div>
        )}
      </div>

      <div className="project-stats">
        <div className="stat">
          <span className="label">Total Projects:</span>
          <span className="value">{projects.length}</span>
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Project: {selectedProject?.projectName}</h3>
            <div className="form-group">
              <label>Project Name:</label>
              <input
                type="text"
                value={editForm.projectName}
                onChange={(e) => setEditForm({...editForm, projectName: e.target.value})}
                placeholder="Enter project name..."
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                placeholder="Enter project description..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Type:</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({...editForm, type: e.target.value})}
              >
                <option value="web application">Web Application</option>
                <option value="game">Game</option>
                <option value="mobile app">Mobile App</option>
                <option value="desktop app">Desktop App</option>
                <option value="library">Library</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Hashtags (comma-separated):</label>
              <input
                type="text"
                value={editForm.hashtags.join(', ')}
                onChange={handleHashtagsChange}
                placeholder="e.g., javascript, react, nodejs"
              />
            </div>
            <div className="modal-actions">
              <button className="btn cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="btn confirm-btn" onClick={handleSubmitEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectOversightTable;