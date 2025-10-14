import React, { useState } from 'react';

const allowedTypes = [
  'web application',
  'game',
  'mobile app',
  'desktop app',
  'library',
  'other',
];

function CreateProjectPopup({ onClose, onCreate }) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [type, setType] = useState('other');
  const [version, setVersion] = useState('v1.0.0');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (projectName.trim() === '') {
      setError('Project name is required.');
      return;
    }
    if (description.trim() === '') {
      setError('Description is required.');
      return;
    }
    // Convert hashtags string to array, split by comma
    const hashtagsArray = hashtags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    onCreate({
      projectName,
      description,
      hashtags: hashtagsArray,
      type,
      version,
    });
    setProjectName('');
    setDescription('');
    setHashtags('');
    setType('other');
    setVersion('v1.0.0');
    setError('');
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <div className="popup-header">
          <h2>Create New Project</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="popup-form">
          <div className="form-group">
            <label htmlFor="projectName">Project Name</label>
            <input
              type="text"
              id="projectName"
              placeholder="My First App"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Describe your project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="hashtags">Hashtags (comma separated)</label>
            <input
              type="text"
              id="hashtags"
              placeholder="e.g. react, node, school"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {allowedTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="version">Version</label>
            <input
              type="text"
              id="version"
              placeholder="v1.0.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="popup-actions">
            <button type="button" onClick={onClose} className="btn cancel-btn">Cancel</button>
            <button type="submit" className="btn create-btn">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectPopup;