import React, { useState, useEffect } from 'react';

function ProjectTypeManager() {
  const [projectTypes, setProjectTypes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjectTypes();
  }, []);

  const fetchProjectTypes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/project-types', {
        credentials: 'include',
        headers: {
          'user-id': localStorage.getItem('userId')
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project types');
      }

      const data = await response.json();
      setProjectTypes(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching project types:', err);
      setError('Failed to load project types');
      setLoading(false);
    }
  };

  const handleAddType = async () => {
    if (!newType.name.trim()) {
      alert('Project type name is required');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/project-types', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('userId')
        },
        body: JSON.stringify(newType)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add project type');
      }

      const result = await response.json();
      alert(result.message);
      setShowAddModal(false);
      setNewType({ name: '', description: '' });
      fetchProjectTypes(); // Refresh the list
    } catch (err) {
      console.error('Error adding project type:', err);
      alert(err.message);
    }
  };

  const handleDeleteType = async (typeName) => {
    if (window.confirm(`Are you sure you want to delete the project type "${typeName}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`http://localhost:3001/api/admin/project-types/${encodeURIComponent(typeName)}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'user-id': localStorage.getItem('userId')
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete project type');
        }

        const result = await response.json();
        alert(result.message);
        fetchProjectTypes(); // Refresh the list
      } catch (err) {
        console.error('Error deleting project type:', err);
        alert(err.message);
      }
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewType({ name: '', description: '' });
  };

  if (loading) {
    return <div className="loading">Loading project types...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="project-type-manager">
      <div className="header-section">
        <h2>Project Type Management</h2>
        <button 
          className="btn primary-btn"
          onClick={() => setShowAddModal(true)}
        >
          Add New Project Type
        </button>
      </div>
      
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projectTypes.map(type => (
              <tr key={type.id}>
                <td>
                  <span className="type-name">{type.name}</span>
                </td>
                <td>{type.description}</td>
                <td>
                  <div className="action-buttons">
                    {!['web application', 'game', 'mobile app', 'desktop app', 'library', 'other'].includes(type.name) && (
                      <button
                        className="btn action-btn delete"
                        onClick={() => handleDeleteType(type.name)}
                      >
                        Delete
                      </button>
                    )}
                    {['web application', 'game', 'mobile app', 'desktop app', 'library', 'other'].includes(type.name) && (
                      <span className="core-type-badge">Core Type</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {projectTypes.length === 0 && (
          <div className="empty-state">
            <p>No project types found.</p>
          </div>
        )}
      </div>

      <div className="project-type-stats">
        <div className="stat">
          <span className="label">Total Project Types:</span>
          <span className="value">{projectTypes.length}</span>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Project Type</h3>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={newType.name}
                onChange={(e) => setNewType({...newType, name: e.target.value})}
                placeholder="Enter project type name..."
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={newType.description}
                onChange={(e) => setNewType({...newType, description: e.target.value})}
                placeholder="Enter project type description..."
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="btn cancel-btn" onClick={handleCancelAdd}>
                Cancel
              </button>
              <button className="btn confirm-btn" onClick={handleAddType}>
                Add Project Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectTypeManager;