import React from 'react';
import ActivityCard from './ActivityCard';

function ActivityFeed({ activities }) {
  return (
    <div className="activity-feed-container">
      <h2>Activity Feed</h2>
      <div className="activity-feed">
        {activities.map((activity, index) => (
          <ActivityCard key={index} activity={activity} />
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;