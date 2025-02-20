import { Repositories } from "../db/index.js";
import { ObjectId, WithId, Document } from "mongodb";
import { Socket, Server } from "socket.io";
import { SocketRooms } from "../taxonomy.js";
import { GameLoopService } from "./gameLoopService.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

interface Entity {
    update?(): void;
}

export class World {
    name: string;
    id: string;
    repositories: Repositories;
    socketServer: Server;
    rooms: WithId<Document>[] = [];
    players: { playerId: ObjectId; socket: Socket }[] = [];


    constructor(doc: WithId<Document>, repositories: Repositories, socketServer: Server) {
        // first check if world exists or not. 
        this.name = doc.name;
        this.id = doc._id.toHexString();
        this.repositories = repositories;
        this.socketServer = socketServer;

    }

    private loadRooms(): Promise<WithId<Document>[]> {
        return this.repositories.roomRepository.listRoomsForWorld(this.id);
    }

    public addPlayer(player: ObjectId, socket: Socket): void {
        this.players.push({ playerId: player, socket: socket });
        // join the global world channel, then place the player in the world and join the appropriate channels (socket.io rooms)
        socket.join(SocketRooms.world.CHANNEL_NAME);
    }

    public removePlayer(player: ObjectId): void {
        this.players = this.players.filter(p => p.playerId.toHexString() !== player.toHexString());
    }

    public async start(): Promise<void> {
        // Define the tick rate (in milliseconds)
        const tickRate = 1000 / 20; // 20 ticks per second

        // Instantiate and start the dedicated game loop service
        const gameLoopService = new GameLoopService(tickRate);
        gameLoopService.start();
    }
    
    // Optionally, you may update this method to call updates from the entity manager,
    // if your EntityManager is extended to support per-tick updates.
    private updateEntities(): void {
        // With the entities now managed by EntityManager, you might iterate over stored entity IDs
        // and update relevant data. For example:
        // const entityIds = this.entityManager.getAllEntityIds();
        // entityIds.forEach(id => { ... perform per-tick logic ... });
    }
    
    private processGameEvents(): void {
        // Process queued events, trigger interactions, run NPC AI, etc.
    }
    
    private broadcastWorldState(): void {
        // Send updates to players via socket.io.
        this.socketServer.to(SocketRooms.world.CHANNEL_NAME).emit("gameStateUpdate", {
            // ... include a summary of the world state ...
        });
    }
}
