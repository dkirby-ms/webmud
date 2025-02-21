import { Repositories } from "../db/index.js";
import { ObjectId, WithId, Document } from "mongodb";
import { Socket, Server } from "socket.io";
import { SocketRooms } from "../taxonomy.js";
import { GameLoopService } from "./gameLoopService.js";
import { RoomManager } from "./roomManager.js";
import { EntityManager } from "./entityManager.js";
import { Redis } from "ioredis";

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
    roomManager: RoomManager;
    entityManager: EntityManager;


    constructor(doc: WithId<Document>, repositories: Repositories, socketServer: Server) {
        // first check if world exists or not. 
        this.name = doc.name;
        this.id = doc._id.toHexString();
        this.repositories = repositories;
        this.socketServer = socketServer;

        const redis = new Redis(REDIS_URL);
        this.entityManager = new EntityManager(this.id, repositories, redis);
        this.roomManager = new RoomManager(repositories, redis);
        
    }

    public addPlayer(player: ObjectId, socket: Socket): void {
        // add a check to see if the player is reconnecting and if so replace the socket in the players array
        const existingPlayer = this.players.find(p => p.playerId.toHexString() === player.toHexString());
        if (existingPlayer) {
            existingPlayer.socket = socket;
            return;
        } else { 
            this.players.push({ playerId: player, socket: socket });
        }
        
        // join the global world channel, then place the player in the world and join the appropriate channels (socket.io rooms)
        socket.join(SocketRooms.world.CHANNEL_NAME);
        this.entityManager.createPlayerEntity(player, socket);
    }

    public removePlayer(player: ObjectId): void {
        this.players = this.players.filter(p => p.playerId.toHexString() !== player.toHexString());
        const playerEntity = this.players.find(p => p.playerId.toHexString() === player.toHexString());
        if (playerEntity) {
            this.entityManager.removePlayerEntity(player);
        }
    }

    public async start(): Promise<void> {
        // Define the tick rate (in milliseconds)
        const tickRate = 1000 / 20; // 20 ticks per second

        // Instantiate and start the dedicated game loop service
        const gameLoopService = new GameLoopService(tickRate, this.id, this.entityManager, this.roomManager, this.socketServer);
        try {
            await gameLoopService.init();
        } catch (err) {
            console.error(`Error initializing game loop service: ${err}`);
            return;
        }
        gameLoopService.start();
    }
    
}
