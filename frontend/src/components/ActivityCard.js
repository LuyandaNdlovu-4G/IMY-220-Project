import React from 'react';
import { Link } from 'react-router-dom';

function ActivityCard({ activity }) {
  return (
    <Link to={`/projects/${activity.project_id}`} className="activity-card-link">
      <div className="activity-card">
        <p>Activity: {activity.user} {activity.action}</p>
        <p>Project: {activity.project}</p>
        <p>Time: {activity.time}</p>
        <div className="tags">
          Tags:
          {activity.tags && Array.isArray(activity.tags) && activity.tags.map(tag => (
            <span key={tag} className="tag-item">#{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default ActivityCard;