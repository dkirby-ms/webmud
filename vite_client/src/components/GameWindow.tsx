import { useEffect, useRef } from "react";
import { useGameService } from "../contexts/GameServiceContext";
import { MapPanel } from "./MapPanel";
import { RoomView } from "./RoomView";
import { CommandConsole } from "./CommandConsole";
import { DeckOverview } from "./DeckOverview";
import type { PlayerCharacter } from "../types";

interface GameWindowProps {
  character: PlayerCharacter;
  onDisconnect: () => void;
}

export function GameWindow({ character, onDisconnect }: GameWindowProps) {
  const { connectionStatus, connect, disconnect } = useGameService();
  const hasConnected = useRef(false);

  // Connect to game service when component mounts
  useEffect(() => {
    if (!hasConnected.current) {
      const gameServiceUrl = import.meta.env.VITE_GAME_SERVICE_URL || 'http://localhost:28999';
      connect(gameServiceUrl, character._id);
      hasConnected.current = true;
    }
    
    // Cleanup: disconnect when component unmounts
    return () => {
      disconnect();
      hasConnected.current = false;
    };
  }, [character._id]); // Only depend on character ID, not the functions

  const handleDisconnect = () => {
    disconnect();
    onDisconnect();
  };

  return (
    
    <div className="h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0">
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
      <div className="flex-1 flex min-h-0">
        {/* Left Panel: Map and Room Details */}
        <div className="flex-1 flex flex-col border-r border-gray-700 min-h-0">
          {/* Map */}
          <div className="bg-gray-800 border-b border-gray-700 flex-shrink-0 h-64">
            <div className="p-2 bg-gray-700 text-sm font-medium">Map</div>
            <MapPanel />
          </div>
          
          {/* Command Console */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-2 bg-gray-700 text-sm font-medium border-b border-gray-600 flex-shrink-0">Game Console</div>
            <div className="flex-1 min-h-0">
              <CommandConsole 
                playerId={character._id}
                disabled={connectionStatus !== 'connected'}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Room View and Deck */}
        <div className="w-80 bg-gray-800 flex flex-col flex-shrink-0">
          {/* Room View */}
          <div className="p-4 border-b border-gray-700">
            <div className="mb-2 text-sm font-medium text-gray-300">Current Room</div>
            <RoomView />
          </div>
          
          {/* Deck Overview */}
          <div className="p-4 flex-1">
            <DeckOverview playerId={character._id} />
          </div>
        </div>
      </div>
    </div>
  );
}
