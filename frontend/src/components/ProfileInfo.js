import React from 'react';
import { getRandomUserIcon } from '../utils/userUtils';

function ProfileInfo({ profile }) {
  const avatarSrc = profile.details?.avatar || getRandomUserIcon(profile._id);

  return (
    <div className="profile-info">
      <img src={avatarSrc} alt="User Profile" className="profile-img" />
      <h1 className="profile-username">{profile.username}</h1>
      <p className="profile-location">{profile.details?.location}</p>
    </div>
  );
}

export default ProfileInfo;