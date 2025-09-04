import React, { useState } from 'react';
import Header from '../components/Header';
import ProjectCard from '../components/ProjectCard';
import CreateProjectPopup from '../components/CreateProjectPopup';
import usePopup from '../hooks/usePopup';

function ProjectsPage() {
  const { isPopupVisible, showPopup, hidePopup } = usePopup();

  // Dummy data for all user projects
  const [projectsData, setProjectsData] = useState([
    { name: 'Project 1', id: 'luyanda-project-1', owner: 'LuyandaNdlovu-4G' },
    { name: 'Project 2', id: 'luyanda-project-2', owner: 'LuyandaNdlovu-4G' },
    { name: 'DevOps Project', id: 'devops-project', owner: 'LuyandaNdlovu-4G' },
    { name: 'IMY 220 Website', id: 'imy-website', owner: 'LuyandaNdlovu-4G' },
  ]);

  const handleCreateProject = (projectName) => {
    // In a real application, you'd send this data to a backend API
    const newProject = {
      name: projectName,
      id: projectName.toLowerCase().replace(/\s/g, '-'),
      owner: 'LuyandaNdlovu-4G'
    };
    setProjectsData([...projectsData, newProject]);
    hidePopup();
  };

  return (
    <div className="projects-page">
      <Header />
      <div className="main-content">
        <div className="content-container">
          <div className="projects-header">
            <h1>Your Projects</h1>
            <button onClick={showPopup} className="btn new-project-btn">+ new project</button>
          </div>
          <div className="projects-list">
            {projectsData.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>
      {isPopupVisible && (
        <CreateProjectPopup
          onClose={hidePopup}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  );
}

export default ProjectsPage;