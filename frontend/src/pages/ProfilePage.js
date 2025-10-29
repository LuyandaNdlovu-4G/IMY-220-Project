import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import ProfileInfo from '../components/ProfileInfo';
import ProfileDetails from '../components/ProfileDetails';
import ActivityFeed from '../components/ActivityFeed';

import { useParams, Link } from 'react-router-dom';

function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [projectsData, setProjectsData] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [activityFeedData, setActivityFeedData] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const { userId: paramUserId } = useParams();
  const loggedInUserId = localStorage.getItem('userId');
  const isOwnProfile = !paramUserId || paramUserId === loggedInUserId;

  const userIdToFetch = isOwnProfile ? loggedInUserId : paramUserId;

  useEffect(() => {
    if (!userIdToFetch) return;

    const abortController = new AbortController();
    const signal = abortController.signal;

    const profileUrl = isOwnProfile 
      ? 'http://localhost:3001/api/profile' 
      : `http://localhost:3001/api/users/${userIdToFetch}/profile`;

    const headers = { 'user-id': loggedInUserId };

    // Fetch combined profile data if viewing another user's profile
    if (!isOwnProfile) {
      fetch(profileUrl, { headers, signal })
        .then(res => {
          if (!signal.aborted && res.ok) return res.json();
          throw new Error('Aborted or failed');
        })
        .then(data => {
          if (!signal.aborted) {
            setProfileData(data.profile);
            setProjectsData(data.projects || []);
            setFriendsData(data.friends || []);
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError' && !signal.aborted) {
            console.error('Failed to fetch profile:', err);
          }
        });
    } else {
      // Original fetches for own profile
      fetch('http://localhost:3001/api/profile', { headers, signal })
        .then(res => {
          if (!signal.aborted && res.ok) return res.json();
          throw new Error('Aborted or failed');
        })
        .then(data => {
          if (!signal.aborted) setProfileData(data);
        })
        .catch(err => {
          if (err.name !== 'AbortError' && !signal.aborted) {
            console.error('Failed to fetch profile:', err);
          }
        });
      
      fetch(`http://localhost:3001/api/projects/mine?userId=${loggedInUserId}`, { headers, signal })
        .then(res => {
          if (!signal.aborted && res.ok) return res.json();
          throw new Error('Aborted or failed');
        })
        .then(data => {
          if (!signal.aborted) setProjectsData(data);
        })
        .catch(err => {
          if (err.name !== 'AbortError' && !signal.aborted) {
            console.error('Failed to fetch projects:', err);
          }
        });

      fetch('http://localhost:3001/api/friends', { headers, signal })
        .then(res => {
          if (!signal.aborted && res.ok) return res.json();
          throw new Error('Aborted or failed');
        })
        .then(data => {
          if (!signal.aborted) setFriendsData(data);
        })
        .catch(err => {
          if (err.name !== 'AbortError' && !signal.aborted) {
            console.error('Failed to fetch friends:', err);
          }
        });
    }

    // Fetch activity feed (always for the displayed user)
    fetch(`http://localhost:3001/api/activity/local`, { 
        headers: { 'user-id': userIdToFetch },
        signal
    })
      .then(res => {
        if (!signal.aborted && res.ok) return res.json();
        throw new Error('Aborted or failed');
      })
      .then(data => {
        if (!signal.aborted) setActivityFeedData(data);
      })
      .catch(err => {
        if (err.name !== 'AbortError' && !signal.aborted) {
          console.error('Failed to fetch activity:', err);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [userIdToFetch, isOwnProfile, loggedInUserId]);

  const handleEditProfile = async (formData) => {
    if (!loggedInUserId) return;
    await fetch('http://localhost:3001/api/profile/details', {
      method: 'PUT',
      headers: {
        'user-id': loggedInUserId
      },
      body: formData
    });
    setShowEdit(false);
    // Refresh profile data
    fetch('http://localhost:3001/api/profile', { 
      headers: {
        'user-id': loggedInUserId
      }
     })
      .then(res => res.json())
      .then(data => setProfileData(data));
  };

  const handleDeleteAccount = async () => {
    if (!loggedInUserId) return;
    await fetch('http://localhost:3001/api/profile', {
      method: 'DELETE',
      headers: {
        'user-id': loggedInUserId
      }
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
          {isOwnProfile && (
            <>
              <button className="btn edit-btn" onClick={() => setShowEdit(true)}>Edit Profile</button>
              <button className="btn delete-btn" onClick={() => setShowDelete(true)}>Delete Account</button>
            </>
          )}
          <div className="profile-sections">
            <div className="section">
              <h2>Projects</h2>
              {projectsData.map((project, index) => (
                <p key={project._id || index}>
                  <Link to={`/projects/${project._id}`}>{project.projectName || project.name}</Link>
                </p>
              ))}
            </div>
            <div className="section">
              <h2>Friends</h2>
              {friendsData.map((friend, index) => (
                <p key={friend._id || index}>
                  <Link to={`/profile/${friend._id}`}>{friend.username || friend.name}</Link>
                </p>
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