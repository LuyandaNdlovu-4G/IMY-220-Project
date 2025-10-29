import React, { useState } from 'react';

function UserManagementTable({ users, onUserAction }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: ''
  });

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${user.username}"? This action cannot be undone.`)) {
      onUserAction(user._id, 'delete');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = () => {
    if (!editForm.username.trim() || !editForm.email.trim()) {
      alert('Username and email are required');
      return;
    }

    onUserAction(selectedUser._id, 'edit', editForm);
    setShowEditModal(false);
    setSelectedUser(null);
    setEditForm({ username: '', email: '', role: '' });
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditForm({ username: '', email: '', role: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="user-management">
      <h2>User Management</h2>
      
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Join Date</th>
              <th>Friends</th>
              <th>Projects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{user.friendCount}</td>
                <td>{user.projectCount}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn action-btn edit"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        className="btn action-btn delete"
                        onClick={() => handleDeleteUser(user)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit User: {selectedUser?.username}</h3>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                placeholder="Enter username..."
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                placeholder="Enter email..."
              />
            </div>
            <div className="form-group">
              <label>Role:</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
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

export default UserManagementTable;