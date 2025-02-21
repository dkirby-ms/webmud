import { logger } from '../util.js'
import { EntityManager } from './entityManager.js';
import { RoomManager } from './roomManager.js';
import { Redis } from 'ioredis';
import { Server } from 'socket.io';

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export class GameLoopService {
    private readonly tickRate: number;
    private timer?: NodeJS.Timeout;
    private entityManager: EntityManager;
    private roomManager: RoomManager;
    private redis: Redis;
    private readonly worldId: string;
    protected socketServer: Server;

    // Additional services or managers can be injected here, e.g., the World instance, EntityManager, etc.
    constructor(tickRate: number, worldId: string, entityManager: EntityManager, roomManager: RoomManager, socketServer: Server) {
        this.entityManager = entityManager;
        this.roomManager = roomManager;
        this.tickRate = tickRate;
        this.redis = new Redis(REDIS_URL);
        this.worldId =  worldId;
        this.socketServer = socketServer;
    }

    public async init(): Promise<void> {
        // Initialize the game loop service here, e.g., load entities, rooms, etc.
        // For example:
        try {
            logger.info(`Initializing game loop service for world ${this.worldId}`);
            await this.entityManager.loadEntitiesFromWorldId(this.worldId);
            await this.roomManager.loadRoomsFromWorldId(this.worldId);
        } catch (err) {
            throw(`Error initializing game loop service: ${err}`);
        }

    }

    public start(): void {
        
        this.timer = setInterval(() => this.tick(), this.tickRate);
        console.log(`Game loop started at ${1000 / this.tickRate} ticks per second`);
    }

    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            console.log(`Game loop stopped.`);
        }
    }

    // The tick method is the heartbeat of your simulation.
    private tick(): void {
        // Example: update entities, process queued events, update world time.
        // You can call world.updateEntities() or similar methods here.
        const i = 1;

        // For example:
        // this.world.updateEntities();
        
        // this.world.processGameEvents();
        // this.world.broadcastWorldState();
    }
}