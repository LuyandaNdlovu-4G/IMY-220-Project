import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import UserManagementTable from '../components/UserManagementTable';
import ProjectOversightTable from '../components/ProjectOversightTable';
import SystemStats from '../components/SystemStats';
import AdminActivityFeed from '../components/AdminActivityFeed';
import ProjectTypeManager from '../components/ProjectTypeManager';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    // Check if user is admin
    if (userRole !== 'admin') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    fetchStats();
  }, [userRole]);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/stats', {
        credentials: 'include',
        headers: {
          'user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }

      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load admin dashboard');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        credentials: 'include',
        headers: {
          'user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/projects', {
        credentials: 'include',
        headers: {
          'user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/activity', {
        credentials: 'include',
        headers: {
          'user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'users':
        fetchUsers();
        break;
      case 'projects':
        fetchProjects();
        break;
      case 'activity':
        fetchActivities();
        break;
      default:
        break;
    }
  };

  const handleUserAction = async (userId, action, data) => {
    try {
      let url = `http://localhost:3001/api/admin/users/${userId}`;
      let method = action === 'delete' ? 'DELETE' : 'PUT';
      
      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('userId')
        },
        body: action !== 'delete' ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      // Refresh users list and stats
      fetchUsers();
      if (action === 'delete') {
        fetchStats();
      }
    } catch (err) {
      console.error(`Error ${action} user:`, err);
      setError(`Failed to ${action} user`);
    }
  };

  const handleProjectDelete = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'user-id': localStorage.getItem('userId')
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Refresh projects list and stats
      fetchProjects();
      fetchStats();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const handleProjectEdit = async (projectId, data) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/projects/${projectId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('userId')
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to edit project');
      }

      // Refresh projects list
      fetchProjects();
    } catch (err) {
      console.error('Error editing project:', err);
      setError('Failed to edit project');
    }
  };

  const handleActivityAction = async (activityId, action, data) => {
    try {
      let url = `http://localhost:3001/api/admin/activity/${activityId}`;
      let method = action === 'delete' ? 'DELETE' : 'PUT';
      
      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('userId')
        },
        body: action !== 'delete' ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} activity`);
      }

      // Refresh activities list
      fetchActivities();
    } catch (err) {
      console.error(`Error ${action} activity:`, err);
      setError(`Failed to ${action} activity`);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <Header />
        <div className="main-content">
          <div className="loading">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <Header />
        <div className="main-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <Header />
      <div className="main-content">
        <div className="admin-dashboard">
          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            <p>System administration and monitoring</p>
          </div>

          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => handleTabChange('stats')}
            >
              Statistics
            </button>
            <button 
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => handleTabChange('users')}
            >
              User Management
            </button>
            <button 
              className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => handleTabChange('projects')}
            >
              Project Oversight
            </button>
            <button 
              className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => handleTabChange('activity')}
            >
              Recent Activity
            </button>
            <button 
              className={`tab-btn ${activeTab === 'project-types' ? 'active' : ''}`}
              onClick={() => handleTabChange('project-types')}
            >
              Project Types
            </button>
          </div>

          <div className="admin-content">
            {activeTab === 'stats' && stats && (
              <SystemStats stats={stats} />
            )}
            
            {activeTab === 'users' && (
              <UserManagementTable 
                users={users} 
                onUserAction={handleUserAction}
              />
            )}
            
            {activeTab === 'projects' && (
              <ProjectOversightTable 
                projects={projects} 
                onProjectDelete={handleProjectDelete}
                onProjectEdit={handleProjectEdit}
              />
            )}
            
            {activeTab === 'activity' && (
              <AdminActivityFeed 
                activities={activities} 
                onActivityAction={handleActivityAction}
              />
            )}
            
            {activeTab === 'project-types' && (
              <ProjectTypeManager />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;