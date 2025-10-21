import React from 'react';
import { Link } from 'react-router-dom';

function FriendCard({ friend, activities, onRemove }) {
  
  const avatarLetter = friend.username ? friend.username.charAt(0).toUpperCase() : '?';

  return (
    <div className="friend-card">
      <div className="friend-card-top">
        <div className="friend-icon">{avatarLetter}</div>
        <div className="friend-info">
          <Link to={`/profile/${friend._id}`} className="friend-profile-link">
            <div className="friend-name">{friend.username}</div>
            <div className="friend-email">{friend.email}</div>
          </Link>
        </div>
        <button className="btn remove-btn" onClick={() => onRemove(friend._id)}>Remove</button>
      </div>
      
      <div className="friend-activities">
        <h4>Recent Activity:</h4>
        <ul>
          {activities && activities.length > 0 ? (
            activities.slice(0, 3).map(act => ( // Show latest 3 activities
              <li key={act._id || act.createdAt}>
                <span>{act.message || act.type}</span>
                <span>{new Date(act.createdAt).toLocaleDateString()}</span>
              </li>
            ))
          ) : (
            <li className="no-activity">No recent activity</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default FriendCard;