import { logger } from '../util.js'
import { EntityManager } from './entityManager.js';
import { RoomManager } from './roomManager.js';
import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export class GameLoopService {
    private tickRate: number;
    private timer?: NodeJS.Timeout;
    private entityManager: EntityManager;
    private roomManager: RoomManager;
    private redis: Redis;

    // Additional services or managers can be injected here, e.g., the World instance, EntityManager, etc.
    constructor(tickRate: number) {
        this.tickRate = tickRate;
        this.redis = new Redis(REDIS_URL);
        this.entityManager = new EntityManager(this.redis);
        this.roomManager = new RoomManager(this.redis);
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
        logger.debug("Game Loop Tick");

        // For example:
        // this.world.updateEntities();
        // this.world.processGameEvents();
        // this.world.broadcastWorldState();
    }
}