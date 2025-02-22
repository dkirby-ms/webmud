import { Document, WithId } from "mongodb";
import { Repositories } from '../db/index.js';
import { RedisClientType } from 'redis';
import { Socket } from "socket.io";

const enum EntityType {
    Player = 'player',
    NPC = 'npc',
}

interface Entity {
    id: string;
    dbRecord: Object;
    pkid: string;
    type: EntityType;
    lastUpdate: number;
    //update?(): void;
}

export class EntityManager {
    private redis: RedisClientType;
    private entitiesRedisKey = 'entity';
    protected entities: Entity[] = [];
    protected repositories: Repositories = {} as Repositories;

    constructor(repositories: Repositories, redis: RedisClientType) {
        this.repositories = repositories;
        this.redis = redis;
    }

    public async loadentitiesFromWorldId(worldId: string): Promise<void> {
        const entitiesData = await this.repositories.entityRepository.listEntitiesForWorld(worldId);
        for (const record of entitiesData) {
            const entity: Entity = {
                id: record._id.toHexString(),
                dbRecord: record,
                pkid: record.entity_pk,
                type: record.entity_type,
                lastUpdate: Date.now(),
            };
            this.addEntity(entity);
        }
    }

    public async addPlayerEntity(playerCharacterId: string, socket: Socket): Promise<void> {
        // lookup the playerCharacter record from the playerCharacters collection
        const playerCharacter = await this.repositories.playerCharacterRepository.getCharacterById(playerCharacterId);
        // then create a new entity from the base playerCharacter record
        if (!playerCharacter)
            throw new Error(`PlayerCharacter with id ${playerCharacterId} does not exist`);
        const entity: Entity = {
            id: playerCharacter.id,
            dbRecord: playerCharacter,
            pkid: playerCharacter.player_id,
            type: EntityType.Player,
            lastUpdate: Date.now(),
        };
        // then add the entity to the world 
        await this.addEntity(entity);
    }

    public async removePlayerEntity(playerCharacterId: string): Promise<void> {
        await this.removeEntity(playerCharacterId);
    }

    // public async createPlayerEntity(playerCharacterId: string, socket: Socket): Promise<void> {
    //     // lookup the playerCharacter record from the playerCharacters collection
    //     const playerCharacter = await this.repositories.playerCharacterRepository.getCharacterById(playerCharacterId);
    //     // then create a new entity from the base playerCharacter record

    //     // then add the entity to the world 
    //     // await this.addEntity(playerEntity);
    // }

    // public async removePlayerEntity(playerCharacterId: string): Promise<void> {
    //     await this.removeEntity(playerCharacterId);
    // }

    async addEntity(entity: Entity): Promise<void> {
        // update in-memory cache
        const index = this.entities.findIndex(e => e.id === entity.id);
        if (index !== -1) {
            this.entities[index] = entity;
        } else {
            this.entities.push(entity);
        }
        // fire and forget: write to Redis without waiting; log any errors
        this.redis.hSet(this.entitiesRedisKey, entity.id, JSON.stringify(entity))
            .catch(err => console.error(`Error writing entity ${entity.id} to Redis: `, err));
    }

    async removeEntity(entityId: string): Promise<void> {
        // remove from local in-memory cache
        this.entities = this.entities.filter(entity => entity.id !== entityId);
        // fire and forget: remove from Redis without awaiting; log any errors
        this.redis.hDel(this.entitiesRedisKey, entityId)
            .catch(err => console.error(`Error removing entity ${entityId} from Redis: `, err));
    }

    async getEntity(entityId: string): Promise<Entity> {
        // Check the in-memory cache first.
        const cachedEntity = this.entities.find(entity => entity.id === entityId);
        if (cachedEntity) {
            return cachedEntity;
        }
        // Retrieve from Redis.
        const entityJSON = await this.redis.hGet(this.entitiesRedisKey, entityId);
        if (!entityJSON) {
            throw new Error(`Entity with id ${entityId} does not exist`);
        }
        const entity = JSON.parse(entityJSON);
        // Add to in-memory cache.
        this.entities.push(entity);
        return entity;
    }

    async getEntities(): Promise<Entity[]> {
        // If the in-memory cache is populated, return it.
        if (this.entities.length > 0) {
            return this.entities;
        }
        // Otherwise, fetch all entities from Redis.
        const redisEntities = await this.redis.hGetAll(this.entitiesRedisKey);
        const entities: Entity[] = Object.values(redisEntities).map(entityJSON => JSON.parse(entityJSON));
        // Update the in-memory cache.
        this.entities = entities;
        return entities;
    }
}