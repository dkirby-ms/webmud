import React, { useState, useEffect } from 'react';
import { Room } from '@/types/database';

interface RoomEditorProps {
  worldId: string;
  onRoomUpdate?: (room: Room) => void;
}

export const RoomEditor: React.FC<RoomEditorProps> = ({ worldId, onRoomUpdate }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchRooms();
  }, [worldId]);

  const fetchRooms = async () => {
    const response = await fetch(`/api/rooms?worldId=${worldId}`);
    const data = await response.json();
    setRooms(data);
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
  };

  return (
    <div className="room-editor">
      <div className="room-map">
        {/* Room map visualization will go here */}
      </div>
      <div className="room-details">
        {/* Room editing form will go here */}
      </div>
    </div>
  );
};
