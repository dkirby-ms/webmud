import React from 'react';
import { useAuth } from '../AuthContext';
import { SignInButton } from './SignInButton';
import { UserAvatar } from './UserAvatar';
import useScroll from '../hooks/useScroll';

export const NavBar: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const scrolled = useScroll(50);

  return (
    <div
      className={`fixed top-0 flex w-full justify-center ${
        scrolled
          ? "border-b border-gray-700 bg-gray-900/80 backdrop-blur-xl"
          : "bg-gray-900/0"
      } z-30 transition-all`}
    >
      <div className="mx-5 flex h-16 w-full max-w-screen-xl items-center justify-between">
        <div className="flex items-center text-2xl font-semibold text-white">
          <img
            src="/logo.svg"
            alt="webMUD logo"
            width="50"
            height="50"
            className="mr-2 rounded-sm"
          />
          <p>webMUD</p>
        </div>
        <div className="navbar-auth">
          {isLoading ? (
            <div className="text-gray-300">Loading...</div>
          ) : isAuthenticated ? (
            <UserAvatar />
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </div>
  );
};
