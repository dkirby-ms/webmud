import React from 'react';
import { useAuth } from '../AuthContext';
import { SignInButton } from './SignInButton';
import { UserAvatar } from './UserAvatar';
import './NavBar.css';

export const NavBar: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo">
          <h1>webMUD Client</h1>
        </div>
        <div className="navbar-auth">
          {isLoading ? (
            <div>Loading...</div>
          ) : isAuthenticated ? (
            <UserAvatar />
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </nav>
  );
};
