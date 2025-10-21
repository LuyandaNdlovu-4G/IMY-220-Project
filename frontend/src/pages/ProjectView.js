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
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    // Fetch project details
    fetch(`http://localhost:3001/api/projects/${id}`, { 
      credentials: 'include',
      headers: {
        'user-id': userId
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.owner) {
          setProject(data);
          setFiles(data.files || []);
          setMembers(data.members || []);

          // Determine if the current user can edit
          const isOwner = data.owner._id === userId;
          const isMember = data.members?.some(member => member.user?._id === userId);
          setCanEdit(isOwner || isMember);
        }
      });

    // Fetch project activity
    fetch(`http://localhost:3001/api/projects/${id}/activity`, { 
      credentials: 'include',
      headers: {
        'user-id': userId
      }
    })
      .then(res => res.json())
      .then(data => setActivities(data.activities || []));
  }, [id]);


  const handleEditProject = async (formData) => {
    const userId = localStorage.getItem('userId');
    const response = await fetch(`http://localhost:3001/api/projects/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'user-id': userId
      },
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
    const userId = localStorage.getItem('userId');
    fetch(`http://localhost:3001/api/projects/${id}`, { 
      credentials: 'include',
      headers: {
        'user-id': userId
      }
    })
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
          <ProjectFiles files={files} project={project} onEditProject={handleEditProject}  refreshFiles={refreshFiles} canEdit={canEdit}/>
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