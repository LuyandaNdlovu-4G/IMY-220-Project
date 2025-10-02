import React from 'react';
import ProjectCard from './ProjectCard';
import usePopup from '../hooks/usePopup';
import CreateProjectPopup from './CreateProjectPopup';

function LeftPanel({ projects, onNewProject }) {
  const { isPopupVisible, showPopup, hidePopup } = usePopup();

  const handleCreate = (projectName) => {
    onNewProject(projectName); // call HomePage’s handler
    hidePopup(); // hide popup after creation
  };

  return (
    <div className="left-panel">
      <button onClick={showPopup} className="btn new-project-btn">+ new project</button>
      
      <h3>Your projects:</h3>
      <div className="projects-list">
        {projects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </div>

      {isPopupVisible && (
        <CreateProjectPopup
          onClose={hidePopup}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

export default LeftPanel;