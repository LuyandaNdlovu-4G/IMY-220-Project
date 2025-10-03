import React, { useEffect, useState } from 'react';
import Header from '../components/Header';

function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [activities, setActivities] = useState({});
  const [emailToAdd, setEmailToAdd] = useState('');

  // Fetch friends on mount
  useEffect(() => {
    fetch('http://localhost:3000/api/friends', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setFriends(data || []));
  }, []);

  
  useEffect(() => {
    fetch('http://localhost:3000/api/activity/local', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        // Group activities by user
        const grouped = {};
        data.forEach(act => {
          if (!grouped[act.user._id]) grouped[act.user._id] = [];
          grouped[act.user._id].push(act);
        });
        setActivities(grouped);
      });
  }, [friends]);

  const handleAddFriend = async () => {
    if (!emailToAdd.trim()) return;
    await fetch('http://localhost:3000/api/friends', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToAdd })
    });
    setEmailToAdd('');
    // Refresh friends list
    fetch('http://localhost:3000/api/friends', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setFriends(data || []));
  };


  const handleRemoveFriend = async (friendId) => {
    await fetch(`http://localhost:3000/api/friends/${friendId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    setFriends(prev => prev.filter(f => f._id !== friendId));
  };

  return (
    <div className="friends-page">
      <Header />
      <div className="main-content">
        <h1>Your Friends</h1>
        <div className="add-friend-form">
          <input
            type="text"
            value={emailToAdd}
            onChange={e => setEmailToAdd(e.target.value)}
            placeholder="Enter friend's email to add"
          />
          <button className="btn add-btn" onClick={handleAddFriend}>Add Friend</button>
        </div>
        <div className="friends-list">
          {friends.map(friend => (
            <div key={friend._id} className="friend-card">
              <div>
                <strong>{friend.username}</strong> ({friend.email})
                <button className="btn remove-btn" onClick={() => handleRemoveFriend(friend._id)}>Remove</button>
              </div>
              <div className="friend-activities">
                <h4>Recent Activity:</h4>
                <ul>
                  {(activities[friend._id] || []).map(act => (
                    <li key={act._id || act.createdAt}>
                      {act.message || act.type} ({new Date(act.createdAt).toLocaleString()})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FriendsPage;