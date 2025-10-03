import React from 'react';
import ActivityCard from './ActivityCard';

function ActivityFeed({ activities }) {
  return (
    <div className="activity-feed-container">
      <h2>Activity Feed</h2>
      <div className="activity-feed">
        {activities.map((activity) => (
          <ActivityCard key={activity._id || activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;