import React, { useEffect, useState } from 'react';
import Header from '../components/Header';

function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [activities, setActivities] = useState({});
  const [emailToAdd, setEmailToAdd] = useState('');
  const userId = localStorage.getItem('userId');

  const fetchFriends = () => {
    if (!userId) return;
    fetch('http://localhost:3001/api/friends', { 
      credentials: 'include',
      headers: {
        'user-id': userId
      }
    })
      .then(res => res.json())
      .then(data => setFriends(data || []));
  };

  const fetchLocalActivity = () => {
    if (!userId) return;
    fetch('http://localhost:3001/api/activity/local', { 
      credentials: 'include',
      headers: {
        'user-id': userId
      }
    })
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
  };

  // Fetch friends on mount
  useEffect(() => {
    fetchFriends();
    fetchLocalActivity();
  }, [userId]);

  const handleAddFriend = async () => {
    if (!emailToAdd.trim() || !userId) return;
    await fetch('http://localhost:3001/api/friends', {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'user-id': userId
      },
      body: JSON.stringify({ email: emailToAdd })
    });
    setEmailToAdd('');
    // Refresh friends list
    fetchFriends();
  };


  const handleRemoveFriend = async (friendId) => {
    if (!userId) return;
    await fetch(`http://localhost:3001/api/friends/${friendId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'user-id': userId
      }
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