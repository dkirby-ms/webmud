import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../AuthContext';
import type { PlayerCharacter } from '../types';

interface GameClientProps {
  character: PlayerCharacter;
  onDisconnect: () => void;
}

export const GameClient: React.FC<GameClientProps> = ({ character, onDisconnect }) => {
  const { user, getGameServiceToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [gameMessages, setGameMessages] = useState<string[]>([]);

  useEffect(() => {
    const connectToGame = async () => {
      try {
        const token = await getGameServiceToken();
        if (!token) {
          setConnectionError('Failed to get authentication token');
          return;
        }

        const gameServiceUrl = import.meta.env.VITE_GAME_SERVICE_URL || 'http://localhost:28999';
        
        const newSocket = io(gameServiceUrl, {
          auth: {
            token,
            userId: user?.localAccountId || user?.homeAccountId,
            userFriendlyName: user?.name,
            playerCharacterId: character._id,
          },
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
          setConnectionError(null);
          setGameMessages(prev => [...prev, 'Connected to game server']);
        });

        newSocket.on('disconnect', () => {
          setIsConnected(false);
          setGameMessages(prev => [...prev, 'Disconnected from game server']);
        });

        newSocket.on('connect_error', (error) => {
          setConnectionError(`Connection failed: ${error.message}`);
          setIsConnected(false);
        });

        // Listen for game messages
        newSocket.on('game:message', (data) => {
          setGameMessages(prev => [...prev, data.message || JSON.stringify(data)]);
        });

        setSocket(newSocket);
      } catch (error) {
        setConnectionError(`Failed to connect: ${error}`);
      }
    };

    connectToGame();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [character, user, getGameServiceToken]);

  const sendCommand = (command: string) => {
    if (socket && isConnected) {
      socket.emit('command', { command });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">webMUD</h1>
            <p className="text-sm text-gray-300">
              Playing as: {character.name} 
              {isConnected ? (
                <span className="ml-2 text-green-400">● Connected</span>
              ) : (
                <span className="ml-2 text-red-400">● Disconnected</span>
              )}
            </p>
          </div>
          <button
            onClick={onDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="bg-red-900 border border-red-700 p-4 m-4 rounded">
          <p className="text-red-200">{connectionError}</p>
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 flex">
        {/* Main Game Window */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="font-mono text-sm space-y-1">
              {gameMessages.map((message, index) => (
                <div key={index} className="text-gray-300">
                  {message}
                </div>
              ))}
            </div>
          </div>

          {/* Command Input */}
          <div className="border-t border-gray-700 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.querySelector('input') as HTMLInputElement;
                if (input.value.trim()) {
                  sendCommand(input.value.trim());
                  setGameMessages(prev => [...prev, `> ${input.value.trim()}`]);
                  input.value = '';
                }
              }}
            >
              <input
                type="text"
                placeholder="Enter command..."
                disabled={!isConnected}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Character Info</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Name:</span> {character.name}
            </div>
            <div>
              <span className="text-gray-400">Species:</span> {character.speciesName}
            </div>
            <div>
              <span className="text-gray-400">Level:</span> {character.level || 1}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
