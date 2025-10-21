import React, { useState } from 'react';

function EditProjectPopup({ project, onClose, onSave }) {
  const [projectName, setProjectName] = useState(project.projectName);
  const [description, setDescription] = useState(project.description);
  const [hashtags, setHashtags] = useState(project.hashtags ? project.hashtags.join(', ') : '');
  const [type, setType] = useState(project.type || '');
  const [version, setVersion] = useState(project.version || '');
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState(project.files || []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleRemoveExistingFile = (fileId) => {
    setExistingFiles(existingFiles.filter(file => file._id !== fileId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare form data for file upload and project update
    const formData = new FormData();
    
    formData.append('projectName', projectName);
    formData.append('description', description);
    formData.append('hashtags', hashtags);
    formData.append('type', type);
    formData.append('version', version);
    
    files.forEach(file => formData.append('files', file));
    // Send IDs of files to keep
    formData.append('keepFiles', JSON.stringify(existingFiles.map(file => file._id)));

    await onSave(formData);
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2>Edit Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Hashtags (comma separated)</label>
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="e.g. web, react, backend"
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="">Select type</option>
              <option value="web application">Web Application</option>
              <option value="game">Game</option>
              <option value="mobile app">Mobile App</option>
              <option value="desktop app">Desktop App</option>
              <option value="library">Library</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Version</label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="e.g. v1.0.0"
            />
          </div>
          <div className="form-group">
            <label>Existing Files</label>
            <ul>
              {existingFiles.map(file => (
                <li key={file._id}>
                  {file.fileName}
                  <button
                    type="button"
                    className="btn remove-btn"
                    onClick={() => handleRemoveExistingFile(file._id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="form-group">
            <label>Upload New Files</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
            />
          </div>
          <div className="popup-actions">
            <button type="button" onClick={onClose} className="btn cancel-btn">Cancel</button>
            <button type="submit" className="btn save-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProjectPopup;