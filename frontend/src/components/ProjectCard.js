import React from 'react';
import { Link } from 'react-router-dom';

function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="project-card-link">
      <div className="project-card">
        <h3>{project.name}</h3>
        <p>{project.owner}: {project.name}</p>
        <span className="btn view-btn">view</span>
      </div>
    </Link>
  );
}

export default ProjectCard;