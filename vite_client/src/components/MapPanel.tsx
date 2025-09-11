import React, { useEffect, useState, useRef, useCallback } from "react";
import type { JSX } from "react";
import { useGameService } from "../contexts/GameServiceContext";
import styles from "./MapPanel.module.css";

// Define types
type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

type Room = {
  id: string;
  name: string;
  exits: Record<Direction, string>;
};

type RoomPosition = {
  x: number;
  y: number;
  z: number;
};

type PositionedRoom = Room & {
  position: RoomPosition;
};

type MapData = {
  rooms: Record<string, Room>;
  playerLocation: string | null;
  visitedRooms: string[];
};

export function MapPanel() {
  const { socket } = useGameService();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapGridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });
  const [translation, setTranslation] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapData, setMapData] = useState<MapData>({
    rooms: {},
    playerLocation: null,
    visitedRooms: []
  });
  const [positionedRooms, setPositionedRooms] = useState<Record<string, PositionedRoom>>({});

  // Listen for map updates from the server
  useEffect(() => {
    if (!socket) return;
    
    socket.on('game:map_update', (data: MapData) => {
      setMapData(data);
    });
    
    return () => {
      socket.off('game:map_update');
    };
  }, [socket]);

  // Calculate room positions whenever map data changes
  useEffect(() => {
    if (Object.keys(mapData.rooms).length === 0) return;
    
    // Create a new object to store positioned rooms
    const newPositionedRooms: Record<string, PositionedRoom> = {};
    
    // Position calculation logic
    const positionRooms = () => {
      // Start with the player's location or the first room if no player location
      const startRoomId = mapData.playerLocation || Object.keys(mapData.rooms)[0];
      if (!startRoomId || !mapData.rooms[startRoomId]) return;
      
      // Set up a queue for breadth-first traversal
      const queue: [string, RoomPosition][] = [[startRoomId, { x: 0, y: 0, z: 0 }]];
      const processed = new Set<string>();
      
      // Process rooms in breadth-first order
      while (queue.length > 0) {
        const [roomId, position] = queue.shift()!;
        if (processed.has(roomId) || !mapData.rooms[roomId]) continue;
        
        // Only include visited rooms
        if (!mapData.visitedRooms.includes(roomId)) {
          processed.add(roomId);
          continue;
        }
        
        // Add the room to our positioned rooms
        newPositionedRooms[roomId] = {
          ...mapData.rooms[roomId],
          position
        };
        processed.add(roomId);
        
        // Queue up neighboring rooms with their positions
        const room = mapData.rooms[roomId];
        Object.entries(room.exits).forEach(([dir, targetId]) => {
          if (processed.has(targetId)) return;
          
          // Calculate next position based on direction
          let nextPosition: RoomPosition;
          switch (dir as Direction) {
            case 'north':
              nextPosition = { ...position, y: position.y - 1 };
              break;
            case 'south':
              nextPosition = { ...position, y: position.y + 1 };
              break;
            case 'east':
              nextPosition = { ...position, x: position.x + 1 };
              break;
            case 'west':
              nextPosition = { ...position, x: position.x - 1 };
              break;
            case 'up':
              nextPosition = { ...position, z: position.z + 1 };
              break;
            case 'down':
              nextPosition = { ...position, z: position.z - 1 };
              break;
            default:
              nextPosition = position;
          }
          
          queue.push([targetId, nextPosition]);
        });
      }
    };
    
    positionRooms();
    setPositionedRooms(newPositionedRooms);
  }, [mapData]);

  // Center map on player's location
  const centerOnPlayer = useCallback(() => {
    if (!mapContainerRef.current || !mapData.playerLocation || !positionedRooms[mapData.playerLocation]) return;
    
    const container = mapContainerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const playerRoom = positionedRooms[mapData.playerLocation];
    const roomSize = 60; // Room width in pixels
    const gap = 20;      // Gap between rooms
    
    const x = -(playerRoom.position.x * (roomSize + gap) - containerWidth / 2 + roomSize / 2);
    const y = -(playerRoom.position.y * (roomSize + gap) - containerHeight / 2 + roomSize / 2);
    
    setTranslation({ x, y });
  }, [mapData.playerLocation, positionedRooms]);

  // Center the map when player location changes or when component mounts
  useEffect(() => {
    centerOnPlayer();
  }, [mapData.playerLocation, positionedRooms, centerOnPlayer]);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartDragPosition({ x: e.clientX - translation.x, y: e.clientY - translation.y });
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - startDragPosition.x;
    const newY = e.clientY - startDragPosition.y;
    
    setTranslation({ x: newX, y: newY });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  // Render the connections between rooms
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    const roomSize = 60;
    const gap = 20;
    
    Object.values(positionedRooms).forEach(room => {
      const { id, position, exits } = room;
      
      Object.entries(exits).forEach(([dir, targetId]) => {
        // Only render connections if the target room is visited and positioned
        if (!positionedRooms[targetId] || !mapData.visitedRooms.includes(targetId)) return;
        
        // Calculate positions for connection
        let connectorStyle: React.CSSProperties = {};
        let connectorClass = '';
        
        switch (dir as Direction) {
          case 'north':
            connectorStyle = {
              left: position.x * (roomSize + gap) + roomSize / 2 - 2,
              top: position.y * (roomSize + gap) - gap,
              height: gap,
            };
            connectorClass = styles.northSouth;
            break;
          case 'south':
            connectorStyle = {
              left: position.x * (roomSize + gap) + roomSize / 2 - 2,
              top: position.y * (roomSize + gap) + roomSize,
              height: gap,
            };
            connectorClass = styles.northSouth;
            break;
          case 'east':
            connectorStyle = {
              left: position.x * (roomSize + gap) + roomSize,
              top: position.y * (roomSize + gap) + roomSize / 2 - 2,
              width: gap,
            };
            connectorClass = styles.eastWest;
            break;
          case 'west':
            connectorStyle = {
              left: position.x * (roomSize + gap) - gap,
              top: position.y * (roomSize + gap) + roomSize / 2 - 2,
              width: gap,
            };
            connectorClass = styles.eastWest;
            break;
          case 'up':
            connectorStyle = {
              left: position.x * (roomSize + gap) + roomSize / 2 - 4,
              top: position.y * (roomSize + gap) + roomSize / 4 - 4,
            };
            connectorClass = `${styles.upDown} ${styles.upConnector}`;
            break;
          case 'down':
            connectorStyle = {
              left: position.x * (roomSize + gap) + roomSize / 2 - 4,
              top: position.y * (roomSize + gap) + roomSize * 3/4 - 4,
            };
            connectorClass = `${styles.upDown} ${styles.downConnector}`;
            break;
        }
        
        connections.push(
          <div
            key={`${id}-${dir}`}
            className={`${styles.connector} ${connectorClass}`}
            style={connectorStyle}
          />
        );
      });
    });
    
    return connections;
  };

  // Render the rooms
  const renderRooms = () => {
    const roomSize = 60;
    const gap = 20;
    
    return Object.values(positionedRooms).map(room => {
      const isCurrentRoom = room.id === mapData.playerLocation;
      
      const style: React.CSSProperties = {
        left: room.position.x * (roomSize + gap),
        top: room.position.y * (roomSize + gap),
        transform: `translateZ(${room.position.z * 10}px)`,
      };
      
      return (
        <div
          key={room.id}
          className={`${styles.room} ${isCurrentRoom ? styles.currentRoom : ''}`}
          style={style}
        >
          <div className={styles.roomName}>{room.name}</div>
        </div>
      );
    });
  };

  // Calculate grid size based on room positions
  const calculateGridSize = () => {
    if (Object.keys(positionedRooms).length === 0) return { width: 0, height: 0 };
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    Object.values(positionedRooms).forEach(room => {
      minX = Math.min(minX, room.position.x);
      maxX = Math.max(maxX, room.position.x);
      minY = Math.min(minY, room.position.y);
      maxY = Math.max(maxY, room.position.y);
    });
    
    const roomSize = 60;
    const gap = 20;
    
    const width = (maxX - minX + 1) * (roomSize + gap);
    const height = (maxY - minY + 1) * (roomSize + gap);
    
    return { width, height };
  };

  const gridSize = calculateGridSize();
  const gridStyle: React.CSSProperties = {
    width: `${gridSize.width}px`,
    height: `${gridSize.height}px`,
    transform: `translate(${translation.x}px, ${translation.y}px) scale(${zoomLevel})`,
  };

  return (
    <div className={styles.mapContainer} ref={mapContainerRef}>
      <div
        className={styles.mapViewport}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className={styles.mapGrid} ref={mapGridRef} style={gridStyle}>
          {renderConnections()}
          {renderRooms()}
        </div>
      </div>
      
      <div className={styles.controls}>
        <button className={styles.controlButton} onClick={handleZoomIn}>+</button>
        <button className={styles.controlButton} onClick={handleZoomOut}>−</button>
        <button className={styles.controlButton} onClick={centerOnPlayer}>⌂</button>
        <div className={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</div>
      </div>
    </div>
  );
}
