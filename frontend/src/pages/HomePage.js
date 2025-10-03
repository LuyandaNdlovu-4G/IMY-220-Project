import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import LeftPanel from '../components/LeftPanel';
import ActivityFeed from '../components/ActivityFeed';

function HomePage() {
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);


     useEffect(() => {
      fetch('http://localhost:3000/api/projects/mine', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setProjects(data));

      fetch('http://localhost:3000/api/activity', { credentials: 'include' })
        .then(res => res.json())
        .then(data => setActivities(data));
    }, []);




  // Handler for creating a new project
  const handleNewProject = async (projectData) => {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(projectData)
    });
    const data = await response.json();
    if (response.ok) {
      setProjects(prev => [...prev, data.project]);
    }
  };

  return (
    <div className="home-page">
      <Header />
      <div className="main-content">
        <LeftPanel 
          projects={projects} 
          onNewProject={handleNewProject} 
        />
        <div className="right-panel">
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}

export default HomePage;