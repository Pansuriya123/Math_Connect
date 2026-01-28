import React from 'react';
import './ProfilePhoto.css';

const ProfilePhoto = ({ 
  profilePhoto, 
  alt = "Profile", 
  className = "profile-photo", 
  size = "medium",
  showInitials = false,
  userName = ""
}) => {
  // Generate initials from username or full name
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Default user icon SVG
  const DefaultUserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="user-icon">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  // Check if profilePhoto is valid (not null, undefined, or empty string)
  const hasValidPhoto = profilePhoto && profilePhoto.trim() !== '';

  return (
    <div className={`profile-photo-container ${className} ${size}`}>
      {hasValidPhoto ? (
        <img 
          src={profilePhoto} 
          alt={alt} 
          className="profile-photo-img"
          onError={(e) => {
            // Fallback if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div 
        className={`profile-photo-placeholder ${!hasValidPhoto ? 'visible' : 'hidden'}`}
        style={{ display: hasValidPhoto ? 'none' : 'flex' }}
      >
        {showInitials && userName ? (
          <span className="profile-initials">{getInitials(userName)}</span>
        ) : (
          <DefaultUserIcon />
        )}
      </div>
    </div>
  );
};

export default ProfilePhoto;
