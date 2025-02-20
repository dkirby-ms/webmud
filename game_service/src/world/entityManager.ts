import { Redis } from "ioredis";
import { ObjectId } from "mongodb";

export class EntityManager {
    private redis: Redis;
    private entities: ObjectId[] = [];

    constructor(redis: Redis) {
        this.redis = redis;
        this.entities = [];    
    }

    // Set the location for an entity (player, mob aka NPC, or item)
    public async setLocation(entityId: string, roomId: string): Promise<void> {
        // using a Redis key pattern for clarity (e.g., location:entity:<id>)
        await this.redis.hset(`location:entity:${entityId}`, "roomId", roomId);
        // Optionally add to a set keyed by room (for fast lookups):
        await this.redis.sadd(`room:${roomId}:entities`, entityId);
    }

    // Get the location for an entity
    public async getLocation(entityId: string): Promise<string | null> {
        return await this.redis.hget(`location:entity:${entityId}`, "roomId");
    }

    // Remove an entity’s location (for cleanup)
    public async removeLocation(entityId: string): Promise<void> {
        // Remove from the room set first
        const roomId = await this.getLocation(entityId);
        if (roomId) {
            await this.redis.srem(`room:${roomId}:entities`, entityId);
        }
        await this.redis.del(`location:entity:${entityId}`);
    }

    // Optionally, list all entities in a room
    public async listEntitiesInRoom(roomId: string): Promise<string[]> {
        return await this.redis.smembers(`room:${roomId}:entities`);
    }

    // Periodic flush/backup can be implemented here
}