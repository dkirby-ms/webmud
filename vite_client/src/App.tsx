import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { NavBar } from './components/NavBar';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <NavBar />
      <main className="app-main">
        {isAuthenticated ? (
          <div className="authenticated-content">
            <h2>Welcome to webMUD, {user?.name || 'User'}!</h2>
            <p>You are successfully authenticated.</p>
            <p>User ID: {user?.localAccountId}</p>
            <p>Email: {user?.username}</p>
          </div>
        ) : (
          <div className="unauthenticated-content">
            <h2>Welcome to webMUD</h2>
            <p>Please sign in to access the game.</p>
          </div>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
