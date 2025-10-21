import React, { useState } from "react";
import EditProjectPopup from "./EditProjectPopup";
import CheckInPopup from "./CheckInPopup"; // Assuming CheckInPopup is in its own file

function ProjectFiles({ files, project, onEditProject, refreshFiles, canEdit }) {
  const [showEdit, setShowEdit] = useState(false);
  const [checkInFileId, setCheckInFileId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:3001/api/projects/${project._id}/files`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'user-id': userId
        },
        body: formData
      });

      if (response.ok) {
        setSelectedFiles([]);
        // Reset the file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        if (refreshFiles) {
          refreshFiles();
        }
      } else {
        const errorData = await response.json();
        alert(`Error uploading files: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('An error occurred while uploading files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:3001/api/projects/${project._id}/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'user-id': userId
        }
      });

      if (response.ok) {
        if (refreshFiles) {
          refreshFiles();
        }
      } else {
        const errorData = await response.json();
        alert(`Error deleting file: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('An error occurred while deleting the file');
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
              {canEdit && file.status === "checkedOut" && (
                <button
                  className="btn check-in-btn"
                  onClick={() => handleCheckIn(file._id)}
                >
                  Check In
                </button>
              )}
              {canEdit && (
                <button
                  className="btn delete-file-btn"
                  onClick={() => handleDeleteFile(file._id, file.fileName)}
                  title="Delete file"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      
      {canEdit && (
        <button className="btn edit-btn" onClick={() => setShowEdit(true)}>
          Edit Project
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
