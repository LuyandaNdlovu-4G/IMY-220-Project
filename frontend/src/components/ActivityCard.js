import React from 'react';
import { useNavigate } from 'react-router-dom';

function ActivityCard({ activity }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Use activity.project._id if available, otherwise fallback to activity.project_id
    const projectId = activity.project?._id || activity.project_id;
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <div className="activity-card" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <p>
        <strong>{activity.user?.username}</strong> {activity.type?.replace('_', ' ') || activity.action}
      </p>
      <p>
        Project: <strong>{activity.project?.projectName || activity.project}</strong> ({activity.project?.type})
      </p>
      <p>
        Time: {new Date(activity.createdAt || activity.time).toLocaleString()}
      </p>
    </div>
  );
}

export default ActivityCard;