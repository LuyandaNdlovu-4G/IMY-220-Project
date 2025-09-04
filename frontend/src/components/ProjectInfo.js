import React from 'react';
import ProjectDetails from './ProjectDetails';
import ProjectMembers from './ProjectMembers';

function ProjectInfo({ project, members }) {
  return (
    <div className="project-info">
      <ProjectDetails project={project} />
      <ProjectMembers members={members} />
    </div>
  );
}

export default ProjectInfo;