import React from 'react';

function ProfileDetails({ details }) {
  return (
    <div className="profile-details-container">
      <div className="details-header">
        <h2>Details</h2>
        <button className="btn edit-profile-btn">Edit Profile</button>
      </div>
      <div className="details-list">
        <p><strong>Name:</strong> {details.name}</p>
        <p><strong>Surname:</strong> {details.surname}</p>
        <p><strong>Email:</strong> {details.email}</p>
        <p><strong>Location:</strong> {details.location}</p>
      </div>
    </div>
  );
}

export default ProfileDetails;