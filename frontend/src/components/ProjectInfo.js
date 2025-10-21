import React from 'react';
import ProjectDetails from './ProjectDetails';
import ProjectMembers from './ProjectMembers';

function ProjectInfo({ project, members, onAddMember, onRemoveMember }) {
  return (
    <div className="project-info">
      <ProjectDetails project={project} />
      <ProjectMembers members={members} project={project} onAddMember={onAddMember} onRemoveMember={onRemoveMember} />
    </div>
  );
}

export default ProjectInfo;