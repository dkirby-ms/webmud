import { Repositories } from "../db/index.js";
import { ObjectId, WithId, Document } from "mongodb";
import { Socket, Server } from "socket.io";
import { GameLoopService } from "./gameLoopService.js";
import { createClient, RedisClientType } from 'redis'; // updated: using node-redis

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

interface Entity {
    update?(): void;
}

export class World {
    name: string;
    id: string;
    repositories: Repositories;
    socketServer: Server;
    players: { playerId: ObjectId; socket: Socket }[] = [];
    loop: GameLoopService;

    constructor(doc: WithId<Document>, repositories: Repositories, socketServer: Server) {
        // first check if world exists or not. 
        this.name = doc.name;
        this.id = doc._id.toHexString();
        this.repositories = repositories;
        this.socketServer = socketServer;

        const redis: RedisClientType = createClient({ url: REDIS_URL }); // updated instantiation
        redis.connect().catch(console.error); // initiate connection

        // Define the tick rate (in milliseconds)
        const tickRate = 1000 / 20; // 20 ticks per second

        // Instantiate and start the dedicated game loop service
        this.loop = new GameLoopService(tickRate, this.id, this.socketServer, this.repositories);
    }

    public async start(): Promise<void> {
        try {
            await this.loop.init();
        } catch (err) {
            console.error(`Error initializing game loop service: ${err}`);
            return;
        }
        this.loop.start();
    }
}
