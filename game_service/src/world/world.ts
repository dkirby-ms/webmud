import { Repositories } from "../db/index.js";
import { Socket, Server } from "socket.io";
import { logger } from '../util.js'
import { createClient, RedisClientType } from 'redis';
import { WithId, Document } from 'mongodb';

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const enum RoomType {
    Room = 'room'
}

interface Entity {
    id?: string;
    dbRecord: Object;
    pkid: string;
    type: string;
    lastUpdate: number;
    location: string; // room id
    //update?(): void;
}

interface Room {
    id: string;
    dbRecord: Object;
    type: RoomType;
    lastUpdate: number;
    //update?(): void;
}

export class World {
    protected name: string;
    protected id: string;
    protected timer?: NodeJS.Timeout;
    private readonly tickRate = 1000 / 20; // 20 ticks per second; // 1 second

    protected redis: RedisClientType;
    protected socketServer: Server;
    protected repositories: Repositories;

    protected players: { userId: string, playerCharacter: any, socket: Socket }[] = []; // this stores the active players in the world and their socket connections
    protected entities: Entity[] = [];
    protected rooms: Room[] = [];

    constructor(doc: WithId<Document>, repositories: Repositories, socketServer: Server) {
        // Initialize the world instance with the provided document, repositories, and socket server
        this.name = doc.name;
        this.id = doc._id.toHexString();
        this.repositories = repositories;
        this.socketServer = socketServer;
        this.redis = createClient({ url: REDIS_URL });
    }

    public async init(): Promise<void> {
        // Connect to redis using node-redis
        await this.redis.connect();
        // Initialize the game loop service here, e.g., load entities, rooms, etc.
        // For example:
        try {
            logger.info(`Initializing entities service for world ${this.name}`);
            const entitiesData = await this.repositories.entityRepository.listEntitiesForWorld(this.id);
            for (const record of entitiesData) {
                const entity: Entity = {
                    dbRecord: record,
                    pkid: record.entity_pk,
                    type: record.entity_type,
                    lastUpdate: Date.now(),
                    location: record.location,
                };
                this.entities.push(entity);
            }
            logger.info(`Initializing rooms service for world ${this.name}`);
            const roomsData = await this.repositories.roomRepository.listRoomsForWorld(this.id);
            for (const record of roomsData) {
                const room: Room = {
                    id: record._id.toString(),
                    dbRecord: record,
                    type: record.room_type,
                    lastUpdate: Date.now(),
                };
                this.rooms.push(room);
            }
        } catch (err) {
            throw (`Error initializing game world: ${err}`);
        }

    }

    public start(): void {
        try {
            this.timer = setInterval(() => this.tick(), this.tickRate);
            logger.info(`World ${this.name} started.`);
        } catch (err) {
            logger.error(`Error initializing game world: ${err}`);
            return;
        }
    }

    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            logger.info(`Game world stopped.`);
        }
    }

    public addPlayer(userId: string, playerCharacter: any, socket: Socket): void {
        // Add the player to the world
        this.players.push({ userId, playerCharacter, socket });
    }


    public removePlayer(userId: string): void {
        // Remove the player from the world
        const player = this.players.find(p => p.userId === userId);
        if (!player) {
            return;
        }
        this.players = this.players.filter(p => p.userId !== userId);
    }

    private tick(): void {
        // Example: update entities, process queued events, update world time.
        // You can call world.updateEntities() or similar methods here.
        //logger.debug(`Game loop tick at ${new Date().toISOString()}`);

        // For example:
        // gatherInputs();
        // processGameEvents();
        this.broadcastWorldState();
    }

    private broadcastWorldState(): void {
        // Broadcast the world state to all connected players
        // For example:

    }

}
