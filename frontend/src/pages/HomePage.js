import React, { useState, useEffect, useContext } from 'react';
import Header from '../components/Header';
import LeftPanel from '../components/LeftPanel';
import ActivityFeed from '../components/ActivityFeed';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

function HomePage() {

  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      api.get("/projects")
        .then(res => {
          console.log("Projects API:", res.data);
          setProjects(res.data);
        })
        .catch(err => console.error(err));

      api.get("/activity/local")
        .then(res => {
          console.log("Activities API:", res.data);
          setActivities(res.data);
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleNewProject = async (projectName) => {
    try {
    const res = await api.post("/projects", {
        projectName,
        description: "No description yet", // placeholder if not provided
        hashtags: [],
        type: "other",
        version: "v1.0.0"
      });

      if (res.status === 201) {
        const newProject = {
          name: res.data.project.projectName,
          id: res.data.project.id,
          owner: res.data.project.owner
        };
        setProjects([...projects, newProject]);
      } else {
        alert(res.data.message || "Failed to create project");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create project.");
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