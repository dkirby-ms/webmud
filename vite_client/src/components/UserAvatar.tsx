import React from 'react';
import { useAuth } from '../AuthContext';

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
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
        <span className="text-white font-medium text-sm">{initials}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{displayName}</span>
        <button 
          className="text-xs text-gray-400 hover:text-gray-200 text-left transition-colors duration-200 disabled:opacity-50" 
          onClick={logout}
          disabled={isLoading}
        >
          {isLoading ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  );
};
