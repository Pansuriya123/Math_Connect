import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfilePhoto from './ProfilePhoto';
import NotificationCenter from './NotificationCenter';
import { baseUrl } from '../Urls';
import './Navbar.css';

function Navbar({ badgeMessage, onProfileClick, navDisabled = false, enableProfileWhenDisabled = false, enableAskWhenDisabled = false, enableChatWhenDisabled = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isUpdated, setIsUpdated] = useState(false);
  const location = useLocation();
  const [hasViewedProfile, setHasViewedProfile] = useState(false);

  useEffect(() => {
    // Reset hasViewedProfile when new badgeMessage comes in
    if (badgeMessage !== 'No changes') {
      setHasViewedProfile(false);
    }
    
    const shouldShowNotification = 
      badgeMessage && 
      badgeMessage.trim() !== '' && 
      badgeMessage !== 'No changes' &&
      !hasViewedProfile;  // Only show if profile hasn't been viewed
      
    setIsUpdated(shouldShowNotification);
    fetchUserData();
  }, [badgeMessage, hasViewedProfile]);

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } // Call the passed handler if it exists
    console.log(badgeMessage)
    navigate('/profile');
    setIsUpdated(false);
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/user/current`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/user/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUser(null);
        navigate('/login');
      } else {
        console.error('Failed to log out');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!user) {
    return null;
  }

  const isProfileDisabled = navDisabled && !enableProfileWhenDisabled;
  const isAskDisabled = navDisabled && !enableAskWhenDisabled;
  const isChatDisabled = navDisabled && !enableChatWhenDisabled;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-left">
            <span className="navbar-logo">∑</span>
            <span className="navbar-title">MathConnect</span>
          </div>
          <div className="navbar-right">
            <button
              onClick={navDisabled ? undefined : () => navigate('/math-tools')}
              className={`nav-button ${navDisabled ? 'nav-button--disabled' : ''}`}
              aria-label="MathTools"
              disabled={navDisabled}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <line x1="2" y1="22" x2="22" y2="22" />
                <line x1="2" y1="2" x2="2" y2="22" />
                <polyline points="21,21 22,22 21,23" />
                <polyline points="1,3 2,2 3,3" />
                <path d="M2 18L6 12L10 16L14 8L18 14L22 6" />
                <circle cx="6" cy="12" r="0.5" fill="currentColor" />
                <circle cx="10" cy="16" r="0.5" fill="currentColor" />
                <circle cx="14" cy="8" r="0.5" fill="currentColor" />
                <circle cx="18" cy="14" r="0.5" fill="currentColor" />
              </svg>
              <span className="nav-label">MathTools</span>
            </button>

            <button
              onClick={isChatDisabled ? undefined : () => navigate('/chats')}
              className={`nav-button ${isChatDisabled ? 'nav-button--disabled' : ''}`}
              aria-label="Chat"
              disabled={isChatDisabled}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="nav-label">Chat</span>
            </button>
            <button
              onClick={isAskDisabled ? undefined : () => navigate('/questions')}
              className={`nav-button ${isAskDisabled ? 'nav-button--disabled' : ''}`}
              aria-label="Ask"
              disabled={isAskDisabled}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon">
  <circle cx="12" cy="12" r="10" />
  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
  <line x1="12" y1="17" x2="12" y2="17" />
</svg>
              <span className="nav-label">Ask</span>
            </button>
            <button
              onClick={navDisabled ? undefined : () => navigate('/leaderboard')}
              className={`nav-button ${navDisabled ? 'nav-button--disabled' : ''}`}
              aria-label="Leaderboard"
              disabled={navDisabled}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="M6 9H4.5a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 4.5 15H6" />
                <path d="M18 9h1.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
              <span className="nav-label">Ranks</span>
            </button>

            <div className="navbar-divider"></div>
            
            <NotificationCenter currentUser={user} />

            <button
              onClick={isProfileDisabled ? undefined : handleProfileClick}
              className={`nav-button ${isProfileDisabled ? 'nav-button--disabled' : ''}`}
              aria-label="Profile"
              disabled={isProfileDisabled}
            >
              <ProfilePhoto 
                profilePhoto={user.profile_photo}
                alt="Profile"
                className="profile-img"
                size="small"
                showInitials={true}
                userName={user.full_name || user.username}
              />
              <span className="nav-label">Profile</span>
              {isUpdated && location.pathname !== '/profile' && (
                <span className="notification-badge" aria-label="New Notifications">
                  ∞
                </span>
              )}
            </button>
            <button onClick={handleLogout} className="nav-button" aria-label="Logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </div>
      </div>
      <div className="navbar-wave"></div>
    </nav>
  );
}

export default Navbar;
