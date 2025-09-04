import React from 'react';
import Header from '../components/Header';
import LeftPanel from '../components/LeftPanel';
import ActivityFeed from '../components/ActivityFeed'; // Import the new component

function HomePage() {
  // Dummy data for projects and activity feed
  const projects = [
    { name: 'Project 1', id: 'luyanda-project-1', owner: 'LuyandaNdlovu-4G' },
    { name: 'Project 2', id: 'luyanda-project-2', owner: 'LuyandaNdlovu-4G' },
  ];

  const activityFeedData = [
    {
      user: 'LuyandaNdlovu-4G',
      action: 'checked in changes to DevAPI',
      project: 'Project 2',
      project_id: 'luyanda-project-2',
      time: '2025-08-02 20:08:54',
      tags: ['JavaScript', 'Node']
    },
    {
      user: 'LuyandaNdlovu-4G',
      action: 'made changes to cat class',
      project: 'Project 2',
      project_id: 'luyanda-project-2',
      time: '2025-08-05 13:56:04',
      tags: ['Java', 'COS212']
    },
  ];

  return (
    <div className="home-page">
      <Header />
      <div className="main-content">
        <LeftPanel projects={projects} />
        <div className="right-panel">
          <ActivityFeed activities={activityFeedData} title="Activity Feed" />
        </div>
      </div>
    </div>
  );
}

export default HomePage;