import React from 'react';
import ActivityCard from './ActivityCard';

function ActivityFeed({ activities }) {
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