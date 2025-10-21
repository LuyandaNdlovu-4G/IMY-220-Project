import React from 'react';

function ProjectCard({ project }) {
  return (
    <div className="project-card">
      <div className="project-card-info">
        <h3>{project.projectName}</h3>
        <p className="project-description">{project.description}</p>
        <p className="project-owner">Owner: {project.owner?.username || 'N/A'}</p>
      </div>
      <div className="project-card-actions">
        <span className="btn view-btn">View</span>
      </div>
    </div>
  );
}

export default ProjectCard;