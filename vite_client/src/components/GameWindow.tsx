import { useEffect } from "react";
import { useGameService } from "../contexts/GameServiceContext";
import { MapPanel } from "./MapPanel";
import { RoomView } from "./RoomView";
import { MessageTypes } from "../lib/messageTypes";
import type { PlayerCharacter } from "../types";

interface GameWindowProps {
  character: PlayerCharacter;
  onDisconnect: () => void;
}

export function GameWindow({ character, onDisconnect }: GameWindowProps) {
  const { socket, connectionStatus, globalChatMessages, connect, disconnect } = useGameService();

  // Connect to game service when component mounts
  useEffect(() => {
    const gameServiceUrl = import.meta.env.VITE_GAME_SERVICE_URL || 'http://localhost:28999';
    connect(gameServiceUrl, character._id);
    
    // Cleanup: disconnect when component unmounts
    return () => {
      disconnect();
    };
  }, [character._id, connect, disconnect]);

  const handleDisconnect = () => {
    disconnect();
    onDisconnect();
  };

  const sendCommand = (command: string) => {
    if (socket && connectionStatus === 'connected') {
      socket.emit(MessageTypes.command.SEND_COMMAND, {
        command,
        playerId: character._id,
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">webMUD - {character.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className={`px-2 py-1 rounded text-xs ${
                connectionStatus === 'connected' ? 'bg-green-900 text-green-200' : 
                connectionStatus === 'connecting' ? 'bg-yellow-900 text-yellow-200' :
                'bg-red-900 text-red-200'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 'Disconnected'}
              </span>
              <span className="text-gray-400">Level {character.level || 1} {character.speciesName}</span>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex">
        {/* Left Panel: Map and Room Details */}
        <div className="flex-1 flex flex-col border-r border-gray-700">
          {/* Map */}
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="p-2 bg-gray-700 text-sm font-medium">Map</div>
            <MapPanel />
          </div>
          
          {/* Messages Panel */}
          <div className="flex-1 flex flex-col">
            <div className="p-2 bg-gray-700 text-sm font-medium border-b border-gray-600">Game Messages</div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="font-mono text-sm space-y-1">
                {globalChatMessages.map((message, index) => (
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
                    input.value = '';
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Enter command..."
                  disabled={connectionStatus !== 'connected'}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </form>
            </div>
          </div>
        </div>

        {/* Right Panel: Room View */}
        <div className="w-80 bg-gray-800 p-4">
          <div className="mb-2 text-sm font-medium text-gray-300">Current Room</div>
          <RoomView />
        </div>
      </div>
    </div>
  );
}
