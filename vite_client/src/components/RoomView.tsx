import { useGameService } from "../contexts/GameServiceContext";

// Match the EntityClientView interface from the game service
interface EntityClientView {
  // Core identity
  id: string;
  name: string;
  description: string;
  type: string; // player, npc, item, etc.
  form: string;
  size: string;
  
  // Health and status
  currentHealth: number;
  maxHealth: number;
  
  // Equipment and inventory
  inventory: string[];
  equipped: string[];
  
  // Position and movement
  currentRoom: string;
  currentLocation: string;
  currentMovementType: string;
  availableMovementTypes: string[];
  
  // Visual indicators
  activeEffects: Array<{
    name: string;
    duration: number;
    modifiers: Record<string, any>;
  }>;
}

export function RoomView() {
  const { gameState } = useGameService();

  // Debug logging to check what data we're receiving
  console.log('RoomView - gameState:', gameState);
  console.log('RoomView - roomEntityViews:', gameState?.roomEntityViews);

  if (!gameState) {
    return (
      <div className="bg-gray-800 p-4 rounded">
        <div className="text-gray-300">Loading room...</div>
      </div>
    );
  }

  const roomEntityViews = gameState?.roomEntityViews || [];

  return (
    <div className="bg-gray-800 p-4 rounded space-y-4">
      {/* Room Info */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">{gameState.currentRoom || "Unknown Room"}</h3>
        <p className="text-gray-300 min-h-[60px]">{gameState.roomDescription || "No description available."}</p>
        {gameState.roomExits && Object.keys(gameState.roomExits).length > 0 && (
          <p className="text-gray-400 text-sm">
            Exits: {Object.keys(gameState.roomExits).join(", ")}
          </p>
        )}
      </div>

      {/* Entities */}
      <div className="space-y-2">
        <h4 className="text-lg font-semibold text-white">Entities in this area:</h4>
        {roomEntityViews.length === 0 ? (
          <p className="text-gray-400 text-sm">No entities in this room</p>
        ) : (
          <div className="space-y-2">
            {roomEntityViews.map((entity: EntityClientView, index: number) => (
              <div
                key={entity.id || `entity-${index}`}
                className={`p-3 rounded ${
                  index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600'
                }`}
              >
                <div className="space-y-2">
                  {/* Entity name and type */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-white text-lg">{entity.name}</span>
                      <div className="text-xs text-gray-400 capitalize">
                        {entity.type} • {entity.form} • {entity.size}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-300">
                        Health: {entity.currentHealth || 0}/{entity.maxHealth || 100}
                      </div>
                      {/* Health bar */}
                      <div className="w-20 h-2 bg-gray-600 rounded mt-1">
                        <div
                          className="h-full rounded transition-all"
                          style={{
                            width: `${((entity.currentHealth || 0) / (entity.maxHealth || 100)) * 100}%`,
                            backgroundColor: getHealthColor(entity.currentHealth, entity.maxHealth),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Entity description */}
                  {entity.description && (
                    <p className="text-gray-300 text-sm">{entity.description}</p>
                  )}
                  
                  {/* Active effects */}
                  {entity.activeEffects && entity.activeEffects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entity.activeEffects.map((effect, effectIndex) => (
                        <span
                          key={effectIndex}
                          className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded"
                        >
                          {effect.name} ({effect.duration}s)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to determine health bar color based on percentage
function getHealthColor(health: number = 0, maxHealth: number = 100): string {
  const healthPercentage = (health / maxHealth) * 100;
  
  if (healthPercentage >= 70) return '#22c55e'; // Green
  if (healthPercentage >= 40) return '#eab308'; // Yellow
  return '#ef4444'; // Red
}
