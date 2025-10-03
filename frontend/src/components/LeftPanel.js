import React from 'react';
import ProjectCard from './ProjectCard';
import usePopup from '../hooks/usePopup';
import CreateProjectPopup from './CreateProjectPopup';

function LeftPanel({ projects, onNewProject }) {
  const { isPopupVisible, showPopup, hidePopup } = usePopup();
  // Ensure projects is always an array
  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <div className="left-panel">
      <button onClick={showPopup} className="btn new-project-btn">+ new project</button>
      <h3>Your projects:</h3>
      <div className="projects-list">
        {safeProjects.length > 0 ? (
          safeProjects.map((project) => (
            <ProjectCard key={project._id || project.id} project={project} />
          ))
        ) : (
          <div className="no-projects">No projects to show.</div>
        )}
      </div>
      {isPopupVisible && (
        <CreateProjectPopup
          onClose={hidePopup}
          onCreate={onNewProject}
        />
      )}
    </div>
  );
}

export default LeftPanel;