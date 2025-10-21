import React from 'react';
import ActivityCard from './ActivityCard';

function ActivityFeed({ activities }) {
  const userId = localStorage.getItem('userId');

  // Don't render activity feed if user is not logged in
  if (!userId) {
    return (
      <div className="activity-feed-container">
        <h2>Activity Feed</h2>
        <p>Please log in to see your activity feed.</p>
      </div>
    );
  }

  // Don't render if no activities
  if (!activities || activities.length === 0) {
    return (
      <div className="activity-feed-container">
        <h2>Activity Feed</h2>
        <p>No recent activities from you or your friends.</p>
      </div>
    );
  }

  return (
    <div className="activity-feed-container">
      <h2>Activity Feed</h2>
      <div className="activity-feed">
        {activities.slice(0, 6).map((activity) => (
          <ActivityCard key={activity._id || activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;