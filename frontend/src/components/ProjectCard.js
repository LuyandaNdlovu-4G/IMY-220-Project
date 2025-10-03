import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectCard({ project }) {
  const navigate = useNavigate();

  const handleView = (e) => {
    e.stopPropagation();
    navigate(`/projects/${project._id}`);
  };

  return (
    <div className="project-card">
      <h3>{project.projectName}</h3>
      <p>{project.owner?.username}: {project.description}</p>
      <span className="btn view-btn" onClick={handleView}>view</span>
    </div>
  );
}

export default ProjectCard;