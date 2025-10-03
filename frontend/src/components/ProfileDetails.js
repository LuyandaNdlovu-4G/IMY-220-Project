import React from 'react';

function ProfileDetails({ details }) {
  return (
    <div className="profile-details-container">
      <div className="details-header">
        <h2>Details</h2>
      </div>
      <div className="details-list">
        <p><strong>Username:</strong> {details.username}</p>
        <p><strong>Email:</strong> {details.email}</p>
        <p><strong>Bio:</strong> {details.details?.bio}</p>
      </div>
    </div>
  );
}

export default ProfileDetails;