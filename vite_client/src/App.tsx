import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { NavBar } from './components/NavBar';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NavBar />
      <main className="pt-16">
        {isAuthenticated ? (
          <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-3xl font-bold mb-4 text-white">Welcome to webMUD, {user?.name || 'User'}!</h2>
            <p className="mb-2 text-gray-300">You are successfully authenticated.</p>
            <p className="mb-2 text-sm text-gray-400">User ID: {user?.localAccountId}</p>
            <p className="text-sm text-gray-400">Email: {user?.username}</p>
            
            {/* Add some content for scroll testing */}
            <div className="mt-8 space-y-4">
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2 text-white">Game World</h3>
                <p className="text-gray-300">Welcome to the webMUD gaming experience. Your adventure awaits!</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2 text-white">Characters</h3>
                <p className="text-gray-300">Create and manage your characters here.</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2 text-white">Worlds</h3>
                <p className="text-gray-300">Explore different game worlds and adventures.</p>
              </div>
              {/* Add more content to enable scrolling */}
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2 text-white">Section {i + 1}</h3>
                  <p className="text-gray-300">This is some sample content to test the scroll behavior of the navbar.</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
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
