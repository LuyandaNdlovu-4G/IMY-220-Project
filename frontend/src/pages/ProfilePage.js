import React from 'react';
import Header from '../components/Header';
import ProfileInfo from '../components/ProfileInfo';
import ProfileDetails from '../components/ProfileDetails';
import ActivityFeed from '../components/ActivityFeed';

function ProfilePage() {
  // Dummy data for the profile page
  const profileData = {
    username: 'LuyandaNdlovu-4G',
    image: '/assets/images/User Icon.png',
    bio: 'Student at the University of Pretoria. Passionate about software development and open-source projects.',
    details: {
      name: 'Luyanda',
      surname: 'Ndlovu',
      email: 'Luyanda.Ndlovu@gmail.com',
      location: 'Pretoria, South Africa'
    }
  };

  const activityFeedData = [
    {
      user: 'LuyandaNdlovu-4G',
      action: 'checked in changes to Project 1',
      project: 'Project 1',
      project_id: 'luyanda-project-1',
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

  const projectsData = [
    { name: 'Project 1', id: 'luyanda-project-1', owner: 'LuyandaNdlovu-4G' },
    { name: 'Project 2', id: 'luyanda-project-2', owner: 'LuyandaNdlovu-4G' }
  ];

  const friendsData = [
    { name: 'Sarah_PG' },
    { name: 'John_Smith' }
  ];

  return (
    <div className="profile-page">
      <Header />
      <div className="main-content">
        <div className="left-panel">
          <ProfileInfo profile={profileData} />
          <div className="profile-sections">
            <div className="section">
              <h2>Projects</h2>
              {projectsData.map((project, index) => (
                <p key={index}>{project.name}</p>
              ))}
            </div>
            <div className="section">
              <h2>Friends</h2>
              {friendsData.map((friend, index) => (
                <p key={index}>{friend.name}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="right-panel">
          <ProfileDetails details={profileData.details} />
          <ActivityFeed activities={activityFeedData} />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;