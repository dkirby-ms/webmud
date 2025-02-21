import { Redis } from "ioredis";
import { ObjectId, WithId, Document } from "mongodb";
import { Repositories } from '../db/index.js';
import { Socket } from "socket.io";

export class EntityManager {
    private redis: Redis;
    protected repositories: Repositories = {} as Repositories;
    protected entities: WithId<Document>[]
    protected worldId: string;

    constructor(worldId: string, repositories: Repositories, redis: Redis) {
        this.worldId = worldId;
        this.redis = redis;
        this.repositories = repositories;
        this.entities = [];
    }

    public async loadEntitiesFromWorldId(worldId: string): Promise<void> {
        const entities = await this.repositories.entityRepository.listEntitiesForWorld(worldId);
        this.entities = entities;
    }

    public async createPlayerEntity(playerId: ObjectId, socket: Socket): Promise<void> {
        // Create a new player entity and add it to the entities array
        const player = await this.repositories.playerCharacterRepository.getCharacterByWorldId(playerId.toHexString(), this.worldId);
        if (player)
            this.entities.push(player);
        else
            throw new Error(`Player not found: ${playerId.toHexString()}`);
    }

    public async removePlayerEntity(playerId: ObjectId): Promise<void> {
        const player = this.entities.find(e => e.player_id === playerId.toHexString());
        if (!player)
            throw new Error(`Player not found: ${playerId.toHexString()}`);
        // socket.rooms.something... need to remove the player from all socket.io rooms???

        // Remove the player entity from the entities array
        this.entities = this.entities.filter(e => e.player_id !== playerId.toHexString());

    }

    
    // Periodic flush/backup can be implemented here
}