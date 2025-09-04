import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import ProjectFiles from '../components/ProjectFiles';
import ProjectInfo from '../components/ProjectInfo'; // Import the new component
import ActivityCard from '../components/ActivityCard';

function ProjectView() {
  const { id } = useParams();

  // Dummy data based on wireframe
  const project = {
    title: 'Project 1',
    description: 'IMY 220 DO low-fidelity project page',
    hashtags: ['JavaScript', 'Node'],
    type: 'Web Page',
    version: 'v.1.3.4'
  };

  const files = [
    { name: 'index.js' },
    { name: 'utils.js' },
    { name: 'config.json' }
  ];

  const members = [
    { name: 'LuyandaNdlovu-4G', role: 'Owner' },
    { name: 'Sarah_PG', role: '' }
  ];

  const activityFeed = [
    { user: 'Sarah_PG', action: 'Checked out...', project: 'Project 1', project_id: 'luyanda-project-1', time: '2025/06/11', tags: [] },
    { user: 'LuyandaNdlovu-4G', action: 'checked in...', project: 'Project 1', project_id: 'luyanda-project-1', time: '2025/06/11', tags: [] }
  ];

  return (
    <div className="project-view-page">
      <Header />
      <div className="main-content">
        <div className="left-panel">
          <Link to="/projects" className="back-link"> &lt; back to projects</Link>
          <h1>{project.title}</h1>
          <ProjectFiles files={files} />
          
          <div className="activity-feed-section">
            <h2>Activity Feed</h2>
            <div className="activity-feed">
              {activityFeed.map((activity, index) => (
                <ActivityCard key={index} activity={activity} />
              ))}
            </div>
          </div>
        </div>
        <div className="right-panel">
          <ProjectInfo project={project} members={members} />
        </div>
      </div>
    </div>
  );
}

export default ProjectView;