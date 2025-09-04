import React from 'react';
import Header from '../components/Header';
import ProjectCard from '../components/ProjectCard';

function ProjectsPage() {
  // Dummy data for all user projects
  const projectsData = [
    { name: 'Project 1', id: 'luyanda-project-1', owner: 'LuyandaNdlovu-4G' },
    { name: 'Project 2', id: 'luyanda-project-2', owner: 'LuyandaNdlovu-4G' },
    { name: 'DevOps Project', id: 'devops-project', owner: 'LuyandaNdlovu-4G' },
    { name: 'IMY 220 Website', id: 'imy-website', owner: 'LuyandaNdlovu-4G' },
  ];

  return (
    <div className="projects-page">
      <Header />
      <div className="main-content">
        <div className="content-container">
          <div className="projects-header">
            <h1>Your Projects</h1>
            <button className="btn new-project-btn">+ new project</button>
          </div>
          <div className="projects-list">
            {projectsData.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectsPage;