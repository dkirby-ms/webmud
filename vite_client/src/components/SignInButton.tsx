import React from 'react';
import { useAuth } from '../AuthContext';
import './SignInButton.css';

export const SignInButton: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <button 
      className="signin-button" 
      onClick={login}
      disabled={isLoading}
    >
      {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
    </button>
  );
};
