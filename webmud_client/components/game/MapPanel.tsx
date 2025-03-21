"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Flex, Box } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";
import styles from "./MapPanel.module.css";

// Define types for our map data
type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';
type Room = {
  id: string;
  name: string;
  exits: Record<Direction, string>; // maps direction to room id
};

type MapPosition = {
  x: number;
  y: number;
  z: number;
};

type MapRoom = Room & {
  position: MapPosition;
};

type MapData = {
  rooms: Record<string, MapRoom>;
  playerLocation: string | null;
  visitedRooms: Set<string>;
};

export function MapPanel() {
    const { data: session } = useSession();
    const { gameState, socket } = useGameService();
    const [mapData, setMapData] = useState<MapData>({
        rooms: {},
        playerLocation: null,
        visitedRooms: new Set<string>()
    });

    // Subscribe to map updates from the game service
    useEffect(() => {
        if (!socket) return;
        
        // Listen for map updates
        const handleMapUpdate = (data: any) => {
            setMapData(prevData => {
                // Convert array of visited rooms back to Set if needed
                let visitedRooms = prevData.visitedRooms;
                if (data.visitedRooms && Array.isArray(data.visitedRooms)) {
                    visitedRooms = new Set(data.visitedRooms);
                }
                
                // Process room data and calculate positions
                const updatedRooms: Record<string, MapRoom> = {};
                
                for (const [roomId, roomData] of Object.entries(data.rooms)) {
                    // If room already has a position in our data, keep it
                    if (prevData.rooms[roomId]) {
                        updatedRooms[roomId] = {
                            ...roomData as Room,
                            position: prevData.rooms[roomId].position
                        };
                    } else {
                        // Calculate position for new rooms
                        const position = calculateRoomPosition(
                            roomId, 
                            data.playerLocation, 
                            {...updatedRooms, ...prevData.rooms}
                        );
                        updatedRooms[roomId] = {
                            ...roomData as Room,
                            position
                        };
                    }
                }
                
                return {
                    rooms: {...prevData.rooms, ...updatedRooms},
                    playerLocation: data.playerLocation || prevData.playerLocation,
                    visitedRooms
                };
            });
        };
        
        socket.on('game:map_update', handleMapUpdate);
        
        return () => {
            socket.off('game:map_update', handleMapUpdate);
        };
    }, [socket]);

    // Calculate position for a room based on its connections
    const calculateRoomPosition = (
        roomId: string, 
        previousRoomId: string | null, 
        existingRooms: Record<string, MapRoom>
    ): MapPosition => {
        // If this is the first room, place it at origin
        if (!previousRoomId || !existingRooms[previousRoomId]) {
            return { x: 0, y: 0, z: 0 };
        }

        const prevRoom = existingRooms[previousRoomId];
        const prevPosition = prevRoom.position;
        
        // Find which exit from the previous room led here
        let direction: Direction | null = null;
        
        for (const [dir, targetId] of Object.entries(prevRoom.exits)) {
            if (targetId === roomId) {
                direction = dir as Direction;
                break;
            }
        }

        // Position based on direction from previous room
        switch (direction) {
            case 'north': return { ...prevPosition, y: prevPosition.y - 1 };
            case 'south': return { ...prevPosition, y: prevPosition.y + 1 };
            case 'east': return { ...prevPosition, x: prevPosition.x + 1 };
            case 'west': return { ...prevPosition, x: prevPosition.x - 1 };
            case 'up': return { ...prevPosition, z: prevPosition.z + 1 };
            case 'down': return { ...prevPosition, z: prevPosition.z - 1 };
            default: 
                // If no connection found, place it adjacent to previous room
                return { ...prevPosition, x: prevPosition.x + 1 };
        }
    };

    // Render the map grid
    const renderMap = () => {
        if (Object.keys(mapData.rooms).length === 0) {
            return <div>No map data available</div>;
        }

        // Find bounds of the map
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        Object.values(mapData.rooms).forEach(room => {
            minX = Math.min(minX, room.position.x);
            maxX = Math.max(maxX, room.position.x);
            minY = Math.min(minY, room.position.y);
            maxY = Math.max(maxY, room.position.y);
        });

        // Calculate grid size
        const gridWidth = maxX - minX + 1;
        const gridHeight = maxY - minY + 1;
        
        // Create a 2D grid
        const grid = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(null));
        
        // Place rooms in grid
        Object.values(mapData.rooms).forEach(room => {
            // Only show visited rooms
            if (mapData.visitedRooms.has(room.id)) {
                const gridX = room.position.x - minX;
                const gridY = room.position.y - minY;
                grid[gridY][gridX] = room;
            }
        });

        return (
            <div className={styles.mapGrid} style={{ gridTemplateColumns: `repeat(${gridWidth}, 1fr)` }}>
                {grid.flat().map((room, index) => (
                    <div key={index} className={styles.mapCell}>
                        {room ? (
                            <RoomNode 
                                room={room} 
                                isPlayerHere={room.id === mapData.playerLocation}
                                connections={getConnectionsForRoom(room.id)}
                            />
                        ) : (
                            <div className={styles.emptyCell} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Get exit connections for a room
    const getConnectionsForRoom = (roomId: string) => {
        const room = mapData.rooms[roomId];
        if (!room) return {};
        
        const connections: Partial<Record<Direction, boolean>> = {};
        
        Object.entries(room.exits).forEach(([dir, targetId]) => {
            const direction = dir as Direction;
            // Only show connections to visited rooms
            connections[direction] = mapData.visitedRooms.has(targetId);
        });
        
        return connections;
    };

    // Room visualization component
    const RoomNode = ({ 
        room, 
        isPlayerHere, 
        connections 
    }: { 
        room: MapRoom; 
        isPlayerHere: boolean; 
        connections: Partial<Record<Direction, boolean>> 
    }) => {
        return (
            <div className={`${styles.room} ${isPlayerHere ? styles.currentRoom : ''}`}>
                <div className={styles.roomName}>{room.name}</div>
                
                {/* Render exit connections */}
                {connections.north && <div className={`${styles.exit} ${styles.northExit}`}></div>}
                {connections.south && <div className={`${styles.exit} ${styles.southExit}`}></div>}
                {connections.east && <div className={`${styles.exit} ${styles.eastExit}`}></div>}
                {connections.west && <div className={`${styles.exit} ${styles.westExit}`}></div>}
                {connections.up && <div className={`${styles.exit} ${styles.upExit}`}>↑</div>}
                {connections.down && <div className={`${styles.exit} ${styles.downExit}`}>↓</div>}
            </div>
        );
    };

    if (!session) return <div>Not authenticated</div>;

    if (!gameState) return <div>Loading...</div>;

    return (
        <Flex direction="column">
            <Box className={styles.mapContainer}>
                {renderMap()}
            </Box>
        </Flex>
    );
}