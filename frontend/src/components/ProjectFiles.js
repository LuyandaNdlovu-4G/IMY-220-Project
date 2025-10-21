import React, { useState } from "react";
import EditProjectPopup from "./EditProjectPopup";
import CheckInPopup from "./CheckInPopup"; // Assuming CheckInPopup is in its own file

function ProjectFiles({ files, project, onEditProject, refreshFiles, canEdit }) {
  const [showEdit, setShowEdit] = useState(false);
  const [checkInFileId, setCheckInFileId] = useState(null);
  const currentUserId = localStorage.getItem("userId");

  const handleCheckOutAndDownload = async (fileId) => {
    const userId = localStorage.getItem('userId');
    const response = await fetch(`http://localhost:3001/api/files/${fileId}/checkout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'user-id': userId
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
      alert(`Error checking out file: ${errorData.message}`);
      return;
    }

    // The backend sends the file as a download. We need to handle the blob response.
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'download';
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
            filename = filenameMatch[1];
        }
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    if (refreshFiles) {
      refreshFiles();
    }
  };

  const handleCheckIn = (fileId) => {
    setCheckInFileId(fileId);
  };

  const handleCheckInUpload = async (formData) => {
    if (!checkInFileId) return;
    const userId = localStorage.getItem('userId');
    const response = await fetch(`http://localhost:3001/api/files/${checkInFileId}/checkin`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'user-id': userId
      },
      body: formData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        alert(`Error checking in file: ${errorData.message}`);
    }

    setCheckInFileId(null);
    if (refreshFiles) {
      refreshFiles();
    }
  };

  return (
    <div className="project-files">
      <h2>Files</h2>
      <div className="file-list">
        {files.length === 0 && <p>No files uploaded yet.</p>}
        {files.map((file) => (
          <div key={file._id} className="file-item">
            <div className="file-item-info">
              <span className="file-name">{file.fileName}</span>
              <div className="file-details">
                <span>Uploaded: {new Date(file.uploadedAt).toLocaleString()}</span>
                {file.status && <span>Status: {file.status === 'checkedOut' ? `Checked Out` : 'Checked In'}</span>}
              </div>
            </div>
            
            <div className="file-actions">
              {canEdit && file.status === "checkedIn" && (
                <button
                  className="btn check-out-btn"
                  onClick={() => handleCheckOutAndDownload(file._id)}
                >
                  Check Out
                </button>
              )}
              {canEdit && file.status === "checkedOut" &&
                file.checkedOutBy === currentUserId && (
                  <button
                    className="btn check-in-btn"
                    onClick={() => handleCheckIn(file._id)}
                  >
                    Check In
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
      {canEdit && (
        <button className="btn edit-btn" onClick={() => setShowEdit(true)}>
          edit project
        </button>
      )}
      {showEdit && (
        <EditProjectPopup
          project={project}
          onClose={() => setShowEdit(false)}
          onSave={onEditProject}
        />
      )}
      {checkInFileId && (
        <CheckInPopup
          project={project}
          onClose={() => setCheckInFileId(null)}
          onUpload={handleCheckInUpload}
        />
      )}
    </div>
  );
}

export default ProjectFiles;
