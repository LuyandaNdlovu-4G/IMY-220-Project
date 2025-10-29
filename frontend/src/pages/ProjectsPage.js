import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import ProjectCard from '../components/ProjectCard';
import CreateProjectPopup from '../components/CreateProjectPopup';
import usePopup from '../hooks/usePopup';

function ProjectsPage() {
  const { isPopupVisible, showPopup, hidePopup } = usePopup();
  const [projectsData, setProjectsData] = useState([]);
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  const fetchProjects = () => {
    if (!userId) return;
    fetch(`http://localhost:3001/api/projects/mine?userId=${userId}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then(data => setProjectsData(data))
      .catch(error => console.error('Error fetching projects:', error));
  };

  // Fetch projects from backend on mount
  useEffect(() => {
    if (!userId) return;

    const abortController = new AbortController();
    const signal = abortController.signal;

    fetch(`http://localhost:3001/api/projects/mine?userId=${userId}`, { 
      credentials: 'include',
      signal
    })
      .then(res => {
        if (!signal.aborted && res.ok) {
          return res.json();
        }
        throw new Error('Aborted or failed');
      })
      .then(data => {
        if (!signal.aborted) setProjectsData(data);
      })
      .catch(error => {
        if (error.name !== 'AbortError' && !signal.aborted) {
          console.error('Error fetching projects:', error);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [userId]);

  // Create new project via backend
  const handleCreateProject = async (projectData) => {
    if (!userId || !username) {
      alert('User not logged in');
      return;
    }
    const response = await fetch('http://localhost:3001/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...projectData, userId, username })
    });
    
    if (response.ok) {
      fetchProjects(); // Refetch projects to get the updated list
    } else {
      const data = await response.json();
      console.error("Failed to create project:", data.message);
    }
    hidePopup();
  };

  const handleRemoveProject = async (projectId) => {
    if (!userId) {
      alert('User not logged in');
      return;
    }
    const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'user-id': userId
      }
    });
    if (response.ok) {
      setProjectsData(prev => prev.filter(p => p._id !== projectId));
    } else {
      const data = await response.json();
      console.error("Failed to delete project:", data.message);
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
                <Link to={`/projects/${project._id || project.id}`} className="project-card-link">
                  <ProjectCard project={project} />
                </Link>
                <button
                  className="btn remove-btn"
                  onClick={() => handleRemoveProject(project._id)}
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