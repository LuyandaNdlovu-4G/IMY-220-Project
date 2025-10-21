import React, { useState } from "react";

function CheckInPopup({ project, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(project?.version || "v1.0.0");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("message", message);
    formData.append("version", version);
    await onUpload(formData);
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2>Check In & Upload File</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Upload New Version</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} required />
          </div>
          <div className="form-group">
            <label>Check-in Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your changes..." required></textarea>
          </div>
          <div className="form-group">
            <label>New Version</label>
            <input type="text" value={version} onChange={e => setVersion(e.target.value)} required />
          </div>
          <div className="popup-actions">
            <button type="button" onClick={onClose} className="btn cancel-btn">Cancel</button>
            <button type="submit" className="btn save-btn">Check In</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckInPopup;
