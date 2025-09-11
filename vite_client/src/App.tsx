import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { GameServiceProvider } from './contexts/GameServiceContext';
import { NavBar } from './components/NavBar';
import { CharacterManagement } from './components/CharacterManagement';
import { GameWindow } from './components/GameWindow';
import { initializeGameServiceApi } from './lib/gameServiceApi';
import type { PlayerCharacter } from './types';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading, getGameServiceToken } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'characters' | 'game'>('home');
  const [connectedCharacter, setConnectedCharacter] = useState<PlayerCharacter | null>(null);

  // Initialize API with auth token provider when auth is ready
  useEffect(() => {
    if (isAuthenticated && getGameServiceToken) {
      initializeGameServiceApi(getGameServiceToken);
    }
  }, [isAuthenticated, getGameServiceToken]);

  const handleGameConnect = (character: PlayerCharacter) => {
    setConnectedCharacter(character);
    setCurrentView('game');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-3xl font-bold mb-4 text-white">Welcome to webMUD</h2>
          <p className="text-gray-300 mb-6">Please sign in to access the game.</p>
          
          {/* Add some marketing content */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2 text-white">Multi-User Dungeon</h3>
              <p className="text-gray-300">Experience classic text-based adventure gaming with modern web technology.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2 text-white">Real-time Multiplayer</h3>
              <p className="text-gray-300">Play with friends and other adventurers in real-time.</p>
            </div>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'characters':
        return <CharacterManagement onGameConnect={handleGameConnect} />;
      case 'game':
        return connectedCharacter ? (
          <GameWindow 
            character={connectedCharacter} 
            onDisconnect={() => {
              setConnectedCharacter(null);
              setCurrentView('characters');
            }} 
          />
        ) : (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-red-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2 text-white">Error</h3>
              <p className="text-gray-300">No character selected for game connection.</p>
              <button
                onClick={() => setCurrentView('characters')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Characters
              </button>
            </div>
          </div>
        );
      case 'home':
      default:
        return (
          <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-3xl font-bold mb-4 text-white">Welcome to webMUD, {user?.name || 'User'}!</h2>
            <p className="mb-2 text-gray-300">You are successfully authenticated.</p>
            <p className="mb-2 text-sm text-gray-400">User ID: {user?.localAccountId}</p>
            <p className="mb-6 text-sm text-gray-400">Email: {user?.username}</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div 
                className="bg-gray-800 p-6 rounded-lg shadow cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setCurrentView('characters')}
              >
                <h3 className="text-xl font-semibold mb-2 text-white">Characters</h3>
                <p className="text-gray-300">Create and manage your characters here.</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2 text-white">Worlds</h3>
                <p className="text-gray-300">Explore different game worlds and adventures.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-gray-900 overflow-hidden">
      <NavBar />
      <main className="pt-16 h-full overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <GameServiceProvider>
        <AppContent />
      </GameServiceProvider>
    </AuthProvider>
  );
}

export default App;
