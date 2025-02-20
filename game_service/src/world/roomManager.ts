import { Redis } from 'ioredis';

export interface Room {
    id: string;
    name: string;
    description: string;
    // Additional properties can be added here (e.g., exits, items, NPCs)
}

export class RoomManager {
    private redis: Redis;
    private roomsKey = 'rooms';

    constructor(redis: Redis) {
        this.redis = redis;
    }

    // Add a room to the manager.
    async addRoom(room: Room): Promise<void> {
        const existing = await this.redis.hget(this.roomsKey, room.id);
        if (existing) {
            throw new Error(`A room with id "${room.id}" already exists.`);
        }
        await this.redis.hset(this.roomsKey, room.id, JSON.stringify(room));
    }

    // Remove a room by its id.
    async removeRoom(roomId: string): Promise<void> {
        const exists = await this.redis.hexists(this.roomsKey, roomId);
        if (!exists) {
            throw new Error(`No room found with id "${roomId}".`);
        }
        await this.redis.hdel(this.roomsKey, roomId);
    }

    // Retrieve a room by its id.
    async getRoom(roomId: string): Promise<Room | undefined> {
        const data = await this.redis.hget(this.roomsKey, roomId);
        return data ? JSON.parse(data) : undefined;
    }

    // List all rooms in the manager.
    async listRooms(): Promise<Room[]> {
        const roomsData = await this.redis.hvals(this.roomsKey);
        return roomsData.map(data => JSON.parse(data));
    }

    // Stub for connecting or linking rooms.
    async connectRooms(roomId1: string, roomId2: string): Promise<void> {
        // TODO: Implement logic for connecting two rooms.
    }
}