import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import FriendCard from '../components/FriendCard'; // Import the FriendCard component

function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [activities, setActivities] = useState({});
  const [emailToAdd, setEmailToAdd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
        const grouped = {};
        data.forEach(act => {
          const activityUser = act.user._id || act.user;
          if (!grouped[activityUser]) grouped[activityUser] = [];
          grouped[activityUser].push(act);
        });
        setActivities(grouped);
      });
  };

  // Fetch friends on mount
  useEffect(() => {
    fetchFriends();
    fetchLocalActivity();
  }, [userId]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
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

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="friends-page">
      <Header />
      <div className="main-content">
        <h1 className="friends-header">Your Friends</h1>
        <div className="friends-actions">
          <input
            type="text"
            className="search-friends-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search friends by name or email..."
          />
          <form className="add-friend-form" onSubmit={handleAddFriend}>
            <input
              type="text"
              value={emailToAdd}
              onChange={e => setEmailToAdd(e.target.value)}
              placeholder="Enter friend's email to add"
            />
            <button type="submit" className="btn add-btn">Add Friend</button>
          </form>
        </div>
        <div className="friends-list">
          {filteredFriends.map(friend => (
            <FriendCard 
              key={friend._id}
              friend={friend}
              activities={activities[friend._id]}
              onRemove={handleRemoveFriend}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FriendsPage;