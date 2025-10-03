import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import ProfileInfo from '../components/ProfileInfo';
import ProfileDetails from '../components/ProfileDetails';
import ActivityFeed from '../components/ActivityFeed';

function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [projectsData, setProjectsData] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [activityFeedData, setActivityFeedData] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/api/profile', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setProfileData(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/api/projects/mine', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setProjectsData(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/api/friends', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setFriendsData(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/api/activity', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setActivityFeedData(data));
  }, []);

  const handleEditProfile = async (formData) => {
    await fetch('http://localhost:3000/api/profile/details', {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });
    setShowEdit(false);
    // Refresh profile data
    fetch('http://localhost:3000/api/profile', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setProfileData(data));
  };

  const handleDeleteAccount = async () => {
    await fetch('http://localhost:3000/api/profile', {
      method: 'DELETE',
      credentials: 'include'
    });
    // Redirect to login or home page after deletion
    window.location.href = '/login';
  };

  if (!profileData) {
    return (
      <div className="profile-page">
        <Header />
        <div className="main-content">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />
      <div className="main-content">
        <div className="left-panel">
          <ProfileInfo profile={profileData} />
          <button className="btn edit-btn" onClick={() => setShowEdit(true)}>Edit Profile</button>
          <button className="btn delete-btn" onClick={() => setShowDelete(true)}>Delete Account</button>
          <div className="profile-sections">
            <div className="section">
              <h2>Projects</h2>
              {projectsData.map((project, index) => (
                <p key={project._id || index}>{project.projectName || project.name}</p>
              ))}
            </div>
            <div className="section">
              <h2>Friends</h2>
              {friendsData.map((friend, index) => (
                <p key={friend._id || index}>{friend.username || friend.name}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="right-panel">
          <ProfileDetails details={profileData || profileData} />
          <ActivityFeed activities={activityFeedData} />
        </div>
      </div>
      {showEdit && (
        <EditProfilePopup
          profile={profileData}
          onClose={() => setShowEdit(false)}
          onSave={handleEditProfile}
        />
      )}
      {showDelete && (
        <DeleteAccountPopup
          onClose={() => setShowDelete(false)}
          onDelete={handleDeleteAccount}
        />
      )}
    </div>
  );
}

// Edit Profile Popup
function EditProfilePopup({ profile, onClose, onSave }) {
  const [bio, setBio] = useState(profile.details?.bio || '');
  const [location, setLocation] = useState(profile.details?.location || '');
  const [avatar, setAvatar] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('location', location);
    if (avatar) formData.append('avatar', avatar);
    await onSave(formData);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Profile Image</label>
            <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files[0])} />
          </div>
          <div className="popup-actions">
            <button type="button" className="btn cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn save-btn">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Account Popup
function DeleteAccountPopup({ onClose, onDelete }) {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText === 'delete';

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2>Delete Account</h2>
        <p>Type <strong>delete</strong> below to confirm account deletion.</p>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="Type 'delete' to confirm"
        />
        <div className="popup-actions">
          <button type="button" className="btn cancel-btn" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn delete-btn"
            disabled={!canDelete}
            onClick={canDelete ? onDelete : undefined}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;