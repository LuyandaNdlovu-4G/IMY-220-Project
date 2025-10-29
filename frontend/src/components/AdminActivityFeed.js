import React, { useState } from 'react';

function AdminActivityFeed({ activities, onActivityAction }) {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    message: '',
    type: ''
  });
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'project_created':
        return '📁';
      case 'file_uploaded':
        return '📄';
      case 'checkout_file':
        return '📥';
      case 'checkin_file':
        return '📤';
      case 'user_joined':
        return '👥';
      default:
        return '📊';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'project_created':
        return 'blue';
      case 'file_uploaded':
        return 'green';
      case 'checkout_file':
        return 'orange';
      case 'checkin_file':
        return 'purple';
      case 'user_joined':
        return 'teal';
      default:
        return 'gray';
    }
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setEditForm({
      message: activity.message,
      type: activity.type
    });
    setShowEditModal(true);
  };

  const handleDeleteActivity = (activity) => {
    if (window.confirm(`Are you sure you want to delete this activity? This action cannot be undone.`)) {
      onActivityAction(activity._id, 'delete');
    }
  };

  const handleSubmitEdit = () => {
    if (!editForm.message.trim()) {
      alert('Activity message is required');
      return;
    }

    onActivityAction(selectedActivity._id, 'edit', editForm);
    setShowEditModal(false);
    setSelectedActivity(null);
    setEditForm({ message: '', type: '' });
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedActivity(null);
    setEditForm({ message: '', type: '' });
  };

  return (
    <div className="admin-activity-feed">
      <h2>Recent System Activity</h2>
      
      {activities.length === 0 ? (
        <div className="empty-state">
          <p>No recent activity found.</p>
        </div>
      ) : (
        <div className="activity-list">
          {activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className={`activity-icon ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="activity-content">
                <div className="activity-message">
                  {activity.message}
                </div>
                
                <div className="activity-meta">
                  <span className="user">
                    By: {activity.user.username}
                  </span>
                  <span className="project">
                    Project: {activity.project.projectName}
                  </span>
                  <span className="type">
                    Type: {activity.type.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="activity-time">
                  {formatDate(activity.createdAt)}
                </div>
              </div>
              
              <div className="activity-actions">
                <button
                  className="btn action-btn edit"
                  onClick={() => handleEditActivity(activity)}
                  title="Edit Activity"
                >
                  Edit
                </button>
                <button
                  className="btn action-btn delete"
                  onClick={() => handleDeleteActivity(activity)}
                  title="Delete Activity"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="activity-summary">
        <p>Showing {activities.length} recent activities</p>
      </div>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Activity</h3>
            <div className="form-group">
              <label>Message:</label>
              <textarea
                value={editForm.message}
                onChange={(e) => setEditForm({...editForm, message: e.target.value})}
                placeholder="Enter activity message..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Type:</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({...editForm, type: e.target.value})}
              >
                <option value="project_created">Project Created</option>
                <option value="file_uploaded">File Uploaded</option>
                <option value="checkout_file">Checkout File</option>
                <option value="checkin_file">Checkin File</option>
                <option value="user_joined">User Joined</option>
                <option value="other">Other</option>
              </select>
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

export default AdminActivityFeed;