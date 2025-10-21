import React from 'react';

function ProfileInfo({ profile }) {
  const defaultImg = '/assets/images/User Icon.png';
  const avatarSrc = profile.details?.avatar ? profile.details.avatar : defaultImg;

  return (
    <div className="profile-info">
      <img src={avatarSrc} alt="User Profile" className="profile-img" />
      <h1 className="profile-username">{profile.username}</h1>
      <p className="profile-location">{profile.details?.location}</p>
    </div>
  );
}

export default ProfileInfo;