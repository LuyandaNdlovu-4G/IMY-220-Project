import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import LeftPanel from '../components/LeftPanel';
import ActivityFeed from '../components/ActivityFeed';

function HomePage() {
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  const fetchProjects = () => {
    if (!userId) return;
    fetch(`http://localhost:3001/api/projects/mine?userId=${userId}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch projects');
        }
        return res.json();
      })
      .then(data => setProjects(data))
      .catch(error => console.error('Error fetching projects:', error));
  };

     useEffect(() => {
      if (userId) {
        fetchProjects();
        
        // Fetch local activities (user + friends) instead of global activities
        fetch(`http://localhost:3001/api/activity/local`, { 
          credentials: 'include',
          headers: {
            'user-id': userId
          }
        })
          .then(res => {
            if (res.ok) {
              return res.json();
            }
            throw new Error('Failed to fetch activities');
          })
          .then(data => setActivities(data))
          .catch(error => {
            console.error('Error fetching activities:', error);
            setActivities([]); // Set empty array on error
          });
      }
    }, [userId]);



  // Handler for creating a new project
  const handleNewProject = async (projectData) => {

    if (!userId || !username) {
      alert('User not logged in');
      return;
    }

    console.log('Creating project with data:', { ...projectData, userId, username });

    const response = await fetch('http://localhost:3001/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...projectData, userId, username }),
    });
    
    if (response.ok) {
      fetchProjects(); // Refetch projects to get the updated list
    } else {
      const data = await response.json();
      console.error("Failed to create project:", data.message);
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
          <ActivityFeed activities={userId ? activities : []} />
        </div>
      </div>
    </div>
  );
}

export default HomePage;