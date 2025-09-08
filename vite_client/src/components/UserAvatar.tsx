import React from 'react';
import { useAuth } from '../AuthContext';
import './UserAvatar.css';

export const UserAvatar: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  if (!user) return null;

  const displayName = user.name || user.username || 'User';
  const initials = displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="user-avatar-container">
      <div className="user-avatar">
        <span className="user-initials">{initials}</span>
      </div>
      <div className="user-info">
        <span className="user-name">{displayName}</span>
        <button 
          className="logout-button" 
          onClick={logout}
          disabled={isLoading}
        >
          {isLoading ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  );
};
