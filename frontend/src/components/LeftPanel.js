import React from 'react';
import { Link } from 'react-router-dom';
import ProjectCard from './ProjectCard';

function LeftPanel({ projects }) {
  return (
    <div className="left-panel">
      <button className="btn new-project-btn">new project</button>
      <h3>Your projects:</h3>
      <div className="projects-list">
        {projects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </div>
    </div>
  );
}

export default LeftPanel;