import React from 'react';
import { useAuth } from '../AuthContext';

export const SignInButton: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <button 
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
      onClick={login}
      disabled={isLoading}
    >
      {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
    </button>
  );
};
