import React from 'react';
import { Link } from 'react-router-dom';

function FriendCard({ friend }) {
  return (
    <div className="friend-card">
      <img src={friend.image} alt={`${friend.name}'s profile`} className="friend-icon" />
      <div className="friend-info">
        <h3>{friend.name}</h3>
        <Link to={`/profile/${friend.id}`} className="view-profile-btn">View Profile</Link>
      </div>
    </div>
  );
}

export default FriendCard;