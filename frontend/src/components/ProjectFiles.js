import React, { useState, useRef } from "react";
import EditProjectPopup from "./EditProjectPopup";

function ProjectFiles({ files, project, onEditProject, refreshFiles }) {
  const [showEdit, setShowEdit] = useState(false);
  const [checkInFileId, setCheckInFileId] = useState(null);
  const currentUserId = localStorage.getItem("userId");
  const downloadRefs = useRef({});

  // Combined check out and download
  const handleCheckOutAndDownload = async (fileId) => {
    await fetch(`http://localhost:3000/api/files/${fileId}/checkout`, {
      method: 'POST',
      credentials: 'include'
    });
    // Trigger download
    if (downloadRefs.current[fileId]) {
      downloadRefs.current[fileId].click();
    }
    // Refresh files to update status
    if (refreshFiles) refreshFiles();
  };

  // Show check-in popup for file upload
  const handleCheckIn = (fileId) => {
    setCheckInFileId(fileId);
  };

  // Handle actual check-in (upload)
  const handleCheckInUpload = async (formData) => {
    await fetch(`http://localhost:3000/api/files/${checkInFileId}/checkin`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    setCheckInFileId(null);
    // Refresh files to update status
    if (refreshFiles) refreshFiles();
  };

  return (
    <div className="project-files">
      <h2>Files</h2>
      <div className="file-list">
        {files.length === 0 && <p>No files uploaded yet.</p>}
        {files.map((file, index) => (
          <div key={index} className="file-item">
            <span>
              <strong>{file.fileName}</strong>
            </span>
            <span>Uploaded: {new Date(file.uploadedAt).toLocaleString()}</span>
            {file.status && <span>Status: {file.status}</span>}
            {/* Hidden download link for programmatic click */}
            <a
              href={`http://localhost:3000/api/files/${file._id}`}
              download={file.fileName}
              ref={el => downloadRefs.current[file._id] = el}
              style={{ display: "none" }}
            />
            {/* Only show Check Out & Download if checked in */}
            {file.status === "checkedIn" && (
              <button
                className="btn check-out-btn"
                onClick={() => handleCheckOutAndDownload(file._id)}
              >
                Check Out & Download
              </button>
            )}
            {/* Only show Check In & Upload if checked out by current user */}
            {file.status === "checkedOut" &&
              file.checkedOutBy === currentUserId && (
                <button
                  className="btn check-in-btn"
                  onClick={() => handleCheckIn(file._id)}
                >
                  Check In & Upload
                </button>
              )}
          </div>
        ))}
      </div>
      <button className="btn edit-btn" onClick={() => setShowEdit(true)}>
        edit project
      </button>
      {showEdit && (
        <EditProjectPopup
          project={project}
          onClose={() => setShowEdit(false)}
          onSave={onEditProject}
        />
      )}
      {/* Popup for check-in/upload */}
      {checkInFileId && (
        <CheckInPopup
          onClose={() => setCheckInFileId(null)}
          onUpload={handleCheckInUpload}
        />
      )}
    </div>
  );
}

function CheckInPopup({ onClose, onUpload }) {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await onUpload(formData);
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2>Check In & Upload File</h2>
        <form onSubmit={handleSubmit}>
          <input type="file" onChange={e => setFile(e.target.files[0])} required />
          <div className="popup-actions">
            <button type="button" onClick={onClose} className="btn cancel-btn">Cancel</button>
            <button type="submit" className="btn save-btn">Upload</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectFiles;
