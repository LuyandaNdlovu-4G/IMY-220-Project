import React from 'react';

function ProjectMembers({ members }) {
  return (
    <div className="project-members">
      <h2>Members</h2>
      <div className="member-list">
        {members.map((member, index) => (
          <div key={index} className="member-item">
            <img 
                src="/assets/images/User Icon.png"
                alt={`${member.name}'s avatar`}
                className="user-icon"
            />
            <span>{member.name} {member.role && `(${member.role})`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectMembers;