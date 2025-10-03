import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import ProjectFiles from '../components/ProjectFiles';
import ProjectInfo from '../components/ProjectInfo';
import ActivityFeed from '../components/ActivityFeed';

function ProjectView() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Fetch project details
    fetch(`http://localhost:3000/api/projects/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setProject(data);
        setFiles(data.files || []);
        setMembers(data.members || []);
      });

    // Fetch project activity
    fetch(`http://localhost:3000/api/projects/${id}/activity`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setActivities(data.activities || []));
  }, [id]);


  const handleEditProject = async (formData) => {
    const response = await fetch(`http://localhost:3000/api/projects/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });
    const data = await response.json();
    if (response.ok) {
      setProject(data.project);
      setFiles(data.project.files || []);
      setMembers(data.project.members || []);
    }
  };

  const refreshFiles = () => {
  fetch(`http://localhost:3000/api/projects/${id}`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      setProject(data);
      setFiles(data.files || []);
      setMembers(data.members || []);
    });
};


  if (!project) {
    return (
      <div className="project-view-page">
        <Header />
        <div className="main-content">
          <div className="left-panel">
            <Link to="/projects" className="back-link"> &lt; back to projects</Link>
            <p>Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-view-page">
      <Header />
      <div className="main-content">
        <div className="left-panel">
          <Link to="/projects" className="back-link"> &lt; back to projects</Link>
          <h1>{project.projectName}</h1>
          <ProjectFiles files={files} project={project} onEditProject={handleEditProject}  refreshFiles={refreshFiles}/>
          <ActivityFeed activities={activities} />
        </div>
        <div className="right-panel">
          <ProjectInfo project={project} members={members} />
        </div>
      </div>
    </div>
  );
}

export default ProjectView;