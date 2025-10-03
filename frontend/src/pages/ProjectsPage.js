import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ProjectCard from '../components/ProjectCard';
import CreateProjectPopup from '../components/CreateProjectPopup';
import usePopup from '../hooks/usePopup';

function ProjectsPage() {
  const { isPopupVisible, showPopup, hidePopup } = usePopup();
  const [projectsData, setProjectsData] = useState([]);

  // Fetch projects from backend on mount
  useEffect(() => {
    fetch('http://localhost:3000/api/projects/mine', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setProjectsData(data));
  }, []);

  // Create new project via backend
  const handleCreateProject = async (projectData) => {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(projectData)
    });
    const data = await response.json();
    if (response.ok && data.project) {
      setProjectsData(prev => [...prev, { ...data.project, owner: { username: data.project.owner } }]);
    }
    hidePopup();
  };

  // Remove project handler
  const handleRemoveProject = async (projectId) => {
    const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (response.ok) {
      setProjectsData(prev => prev.filter(p => p._id !== projectId && p.id !== projectId));
    }
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
              <div key={project._id || project.id} className="project-list-item">
                <ProjectCard project={project} />
                <button
                  className="btn remove-btn"
                  onClick={() => handleRemoveProject(project._id || project.id)}
                >
                  Remove
                </button>
              </div>
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