import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProfileInfo({ profile }) {

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  return (
    <div className="profile-info">
      <img src={profile.image} alt="User Profile" className="profile-img" />
      <h1 className="profile-username">{profile.username}</h1>
      <p className="profile-bio">{profile.bio}</p>
      <button className="btn logout-btn" onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}

export default ProfileInfo;