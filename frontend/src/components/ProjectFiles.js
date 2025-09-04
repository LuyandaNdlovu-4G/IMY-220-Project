import React from 'react';

function ProjectFiles({ files }) {
  return (
    <div className="project-files">
      <h2>Files</h2>
      <div className="file-list">
        {files.map((file, index) => (
          <div key={index} className="file-item">
            <span>{file.name}</span>
            <div className="file-actions">
              <button className="btn check-in-btn">check in</button>
              <button className="btn check-out-btn">check out</button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn edit-btn">edit project</button>
    </div>
  );
}

export default ProjectFiles;