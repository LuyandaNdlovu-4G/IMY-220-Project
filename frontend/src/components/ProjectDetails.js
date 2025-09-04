import React from 'react';

function ProjectDetails({ project }) {
  return (
    <div className="project-details">
      <h2>Details</h2>
      <p><strong>Description:</strong> {project.description}</p>
      <p><strong>Hashtags:</strong> {project.hashtags.map(tag => (
        <span key={tag} className="tag-item">#{tag}</span>
      ))}</p>
      <p><strong>Type:</strong> {project.type}</p>
      <p><strong>Version:</strong> {project.version}</p>
    </div>
  );
}

export default ProjectDetails;