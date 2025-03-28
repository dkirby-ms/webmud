"use client";
import { Box, Flex, Text, Card } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext";
import "./EntityList.css";

interface EntityState {
  name: string;
  health: number;
  maxHealth: number;
  currentHealth: number;
  type: string;
  [key: string]: any; // Allow for additional properties
}

export function EntityList() {
  const { gameState } = useGameService();
  // Update to use roomEntityViews instead of roomEntityStates
  const roomEntityViews = gameState?.roomEntityViews || [];

  if (!roomEntityViews || roomEntityViews.length === 0) {
    return <Box py="2"><Text size="2">No entities in this room</Text></Box>;
  }

  return (
    <Box className="entity-list-container">
      <Text className="entity-title" weight="bold" size="2" mb="2">Entities in this area:</Text>
      <Flex direction="column" gap="2" className="entity-list">
        {roomEntityViews.map((entity: EntityState, index: number) => (
          <Card 
            key={entity.id || `entity-${index}`} 
            size="1"
            className={`entity-card ${index % 2 === 0 ? 'entity-card-even' : 'entity-card-odd'}`}
          >
            <Flex justify="between" align="center" className="entity-content">
              <Text weight="medium" className="entity-name">{entity.name}</Text>
              <Box>
                <Text size="2" className="entity-health-text">
                  Health: {entity.currentHealth || 0}/{entity.maxHealth || 100}
                </Text>
                {/* Health bar */}
                <Box className="health-bar-container">
                  <Box 
                    className="health-bar"
                    style={{ 
                      width: `${((entity.currentHealth || 0) / (entity.maxHealth || 100)) * 100}%`,
                      backgroundColor: getHealthColor(entity.currentHealth, entity.maxHealth),
                    }}
                  />
                </Box>
              </Box>
            </Flex>
          </Card>
        ))}
      </Flex>
    </Box>
  );
}

// Helper function to determine health bar color based on percentage
function getHealthColor(health: number = 0, maxHealth: number = 100): string {
  const healthPercentage = (health / maxHealth) * 100;
  
  if (healthPercentage >= 70) return '#22c55e'; // Green
  if (healthPercentage >= 40) return '#eab308'; // Yellow
  return '#ef4444'; // Red
}
