import { useGameService } from "../contexts/GameServiceContext";

interface EntityState {
  id?: string;
  name: string;
  health?: number;
  maxHealth?: number;
  currentHealth?: number;
  type?: string;
  [key: string]: any;
}

export function RoomView() {
  const { gameState } = useGameService();

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
        <h3 className="text-xl font-bold text-white">{gameState.room || "Unknown Room"}</h3>
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
            {roomEntityViews.map((entity: EntityState, index: number) => (
              <div
                key={entity.id || `entity-${index}`}
                className={`p-3 rounded ${
                  index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-750'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white">{entity.name}</span>
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
