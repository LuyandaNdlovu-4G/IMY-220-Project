import React from 'react';

function SystemStats({ stats }) {
  return (
    <div className="system-stats">
      <h2>System Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-info">
            <h3>Total Projects</h3>
            <p className="stat-number">{stats.totalProjects}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total Activities</h3>
            <p className="stat-number">{stats.totalActivities}</p>
          </div>
        </div>


      </div>

      <div className="recent-activity-stats">
        <h3>Recent Activity (Last 30 Days)</h3>
        <div className="recent-stats">
          <div className="recent-stat">
            <span className="label">New Users:</span>
            <span className="value">{stats.recentUsers}</span>
          </div>
          <div className="recent-stat">
            <span className="label">New Projects:</span>
            <span className="value">{stats.recentProjects}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemStats;