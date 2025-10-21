import React from 'react';

function ProjectMembers({ members, project, onAddMember, onRemoveMember }) {
  const currentUserId = localStorage.getItem('userId');
  const isOwner = project && project.owner && project.owner._id === currentUserId;

  const handleRemoveMember = (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      onRemoveMember(memberId);
    }
  };

  return (
    <div className="project-members">
      <div className="members-header">
        <h2>Members</h2>
        {isOwner && (
          <button className="btn add-member-btn" onClick={onAddMember}>
            + Add Member
          </button>
        )}
      </div>
      <div className="member-list">
        {members && members.length > 0 ? (
          members.map((member, index) => (
            <div key={member.user?._id || index} className="member-item">
              <div className="member-info">
                <img 
                  src={member.user?.details?.avatar ? `http://localhost:3001${member.user.details.avatar}` : "/assets/images/User Icon.png"}
                  alt={`${member.user?.username || 'User'}'s avatar`}
                  className="user-icon"
                />
                <span>
                  {member.user?.username || 'Unknown User'} 
                  {member.role && ` (${member.role})`}
                </span>
              </div>
              {isOwner && member.user?._id !== currentUserId && (
                <button
                  className="btn remove-member-btn"
                  onClick={() => handleRemoveMember(member.user._id, member.user.username)}
                  title="Remove member"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No members found.</p>
        )}
      </div>
    </div>
  );
}

export default ProjectMembers;