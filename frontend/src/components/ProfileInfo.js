import React from 'react';
import { Link } from 'react-router-dom';

function ProfileInfo({ profile }) {
  return (
    <div className="profile-info">
      <img src={profile.image} alt="User Profile" className="profile-img" />
      <h1 className="profile-username">{profile.username}</h1>
      <p className="profile-bio">{profile.bio}</p>
      <Link to="/login" className="btn logout-btn">Log Out</Link>
    </div>
  );
}

export default ProfileInfo;