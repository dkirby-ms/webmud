import { Document, WithId } from "mongodb";
import { Repositories } from '../db/index.js';
import { RedisClientType } from 'redis';
import { Socket } from "socket.io";

const enum RoomType {
    Room = 'room'
}

interface Room {
    id: string;
    dbRecord: Object;
    type: RoomType;
    lastUpdate: number;
    //update?(): void;
}

export class RoomManager {
    private redis: RedisClientType;
    private roomsRedisKey = 'room';
    protected rooms: Room[] = [];
    protected repositories: Repositories = {} as Repositories;

    constructor(repositories: Repositories, redis: RedisClientType) {
        this.repositories = repositories;
        this.redis = redis;
    }

    public async loadRoomsFromWorldId(worldId: string): Promise<void> {
        const roomsData = await this.repositories.roomRepository.listRoomsForWorld(worldId);
        for (const record of roomsData) {
            const room: Room = {
                id: record._id.toString(),
                dbRecord: record,
                type: record.room_type,
                lastUpdate: Date.now(),
            };
            this.addroom(room);
        }
    }

    async addroom(room: Room): Promise<void> {
        // update in-memory cache
        const index = this.rooms.findIndex(e => e.id === room.id);
        if (index !== -1) {
            this.rooms[index] = room;
        } else {
            this.rooms.push(room);
        }
        // fire and forget: write to Redis without waiting; log any errors
        this.redis.hSet(this.roomsRedisKey, room.id, JSON.stringify(room))
            .catch(err => console.error(`Error writing room ${room.id} to Redis: `, err));
    }

    async removeRoom(roomId: string): Promise<void> {
        // remove from local in-memory cache
        this.rooms = this.rooms.filter(room => room.id !== roomId);
        // fire and forget: remove from Redis without awaiting; log any errors
        this.redis.hDel(this.roomsRedisKey, roomId)
            .catch(err => console.error(`Error removing room ${roomId} from Redis: `, err));
    }

    async getroom(roomId: string): Promise<Room> {
        // Check the in-memory cache first.
        const cachedRoom = this.rooms.find(room => room.id === roomId);
        if (cachedRoom) {
            return cachedRoom;
        }
        // Retrieve from Redis.
        const roomJSON = await this.redis.hGet(this.roomsRedisKey, roomId);
        if (!roomJSON) {
            throw new Error(`room with id ${roomId} does not exist`);
        }
        const room = JSON.parse(roomJSON);
        // Add to in-memory cache.
        this.rooms.push(room);
        return room;
    }

    async getrooms(): Promise<Room[]> {
        // If the in-memory cache is populated, return it.
        if (this.rooms.length > 0) {
            return this.rooms;
        }
        // Otherwise, fetch all rooms from Redis.
        const redisrooms = await this.redis.hGetAll(this.roomsRedisKey);
        const rooms: Room[] = Object.values(redisrooms).map(roomJSON => JSON.parse(roomJSON));
        // Update the in-memory cache.
        this.rooms = rooms;
        return rooms;
    }
}