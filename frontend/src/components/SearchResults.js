import React from 'react';
import { Link } from 'react-router-dom';

function SearchResults({ searchResults, isVisible, onClose, searchQuery }) {
  if (!isVisible || !searchResults) {
    return null;
  }

  const { users = [], projects = [] } = searchResults;
  const totalResults = users.length + projects.length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="search-highlight">{part}</span> : part
    );
  };

  return (
    <div className="search-results-overlay" onClick={onClose}>
      <div className="search-results-dropdown" onClick={(e) => e.stopPropagation()}>
        <div className="search-results-header">
          <h3>Search Results</h3>
          <button className="close-search-btn" onClick={onClose}>×</button>
        </div>
        
        {totalResults === 0 ? (
          <div className="no-results">
            <p>No results found for "{searchQuery}"</p>
            <p className="search-tip">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <div className="search-results-content">
            {users.length > 0 && (
              <div className="search-section">
                <h4 className="section-title">Users ({users.length})</h4>
                <div className="search-items">
                  {users.map(user => (
                    <Link 
                      key={user._id} 
                      to={`/profile/${user._id}`} 
                      className="search-item user-item"
                      onClick={onClose}
                    >
                      <div className="search-item-avatar">
                        {user.details?.avatar ? (
                          <img src={user.details.avatar} alt={user.username} />
                        ) : (
                          <div className="default-avatar">
                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="search-item-content">
                        <div className="search-item-title">
                          {highlightText(user.username, searchQuery)}
                        </div>
                        <div className="search-item-subtitle">
                          {highlightText(user.email, searchQuery)}
                        </div>
                        {user.details?.bio && (
                          <div className="search-item-description">
                            {highlightText(user.details.bio.substring(0, 80), searchQuery)}
                            {user.details.bio.length > 80 ? '...' : ''}
                          </div>
                        )}
                        <div className="search-item-meta">
                          Joined {formatDate(user.createdAt)}
                          {user.similarity && user.similarity < 1.0 && (
                            <span className="similarity-score">
                              {Math.round(user.similarity * 100)}% match
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {projects.length > 0 && (
              <div className="search-section">
                <h4 className="section-title">Projects ({projects.length})</h4>
                <div className="search-items">
                  {projects.map(project => (
                    <Link 
                      key={project._id} 
                      to={`/projects/${project._id}`} 
                      className="search-item project-item"
                      onClick={onClose}
                    >
                      <div className="search-item-icon">
                      </div>
                      <div className="search-item-content">
                        <div className="search-item-title">
                          {highlightText(project.projectName, searchQuery)}
                        </div>
                        <div className="search-item-subtitle">
                          by {project.ownerInfo?.username} • {project.type}
                        </div>
                        {project.description && (
                          <div className="search-item-description">
                            {highlightText(project.description.substring(0, 100), searchQuery)}
                            {project.description.length > 100 ? '...' : ''}
                          </div>
                        )}
                        <div className="search-item-meta">
                          {project.memberCount} members • Created {formatDate(project.createdAt)}
                          {project.hashtags && project.hashtags.length > 0 && (
                            <div className="project-tags">
                              {project.hashtags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="tag">
                                  #{highlightText(tag, searchQuery)}
                                </span>
                              ))}
                            </div>
                          )}
                          {project.similarity && project.similarity < 1.0 && (
                            <span className="similarity-score">
                              {Math.round(project.similarity * 100)}% match
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            <div className="search-results-footer">
              <p>Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;