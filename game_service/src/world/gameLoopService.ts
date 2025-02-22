import { logger } from '../util.js'
import { EntityManager } from './entityManager.js';
import { RoomManager } from './roomManager.js';
import { Server } from 'socket.io';
import { createClient, RedisClientType } from 'redis';
import { Repositories } from '../db/index.js';
import { ObjectId, WithId, Document } from 'mongodb';
import { Socket } from 'socket.io';

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export class GameLoopService {
    private readonly tickRate: number;
    private timer?: NodeJS.Timeout;
    private entityManager: EntityManager; // this manager handles all activy "entities" where entity is any player, NPC, or object in the game world; may split objects out later from entities.
    private roomManager: RoomManager;
    private redis: RedisClientType;
    private readonly worldId: string;
    protected socketServer: Server;
    protected repositories: Repositories;
    protected players: { userId: string, playerCharacterId: string, socket: Socket }[] = []; // this stores the active players in the world and their socket connections

    // Additional services or managers can be injected here, e.g., the World instance, EntityManager, etc.
    constructor(tickRate: number, worldId: string, socketServer: Server, repositories: Repositories) {
        this.worldId =  worldId;
        this.repositories = repositories;
        this.tickRate = tickRate;
        this.redis = createClient({ url: REDIS_URL });
        this.socketServer = socketServer;
        this.entityManager = new EntityManager(repositories, this.redis);
        this.roomManager = new RoomManager(repositories, this.redis);
    }

    public async init(): Promise<void> {
        // Connect to redis using node-redis
        await this.redis.connect();
        // Initialize the game loop service here, e.g., load entities, rooms, etc.
        // For example:
        try {
            logger.info(`Initializing game loop service for world ${this.worldId}`);
            await this.entityManager.loadentitiesFromWorldId(this.worldId);
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

    public addPlayer(userId: string, playerCharacterId: string, socket: Socket): void {
        // const existingPlayer = this.players.find(p => p.userId === userId);
        // if (existingPlayer) {
        //     existingPlayer.socket = socket;
        // } else { 
        //     this.players.push({ userId: userId, playerCharacterId: playerCharacterId, socket: socket });
        // }
        
        // // create player entity in state/redis
        // //this.joinPlayerToRooms(player, socket);
        // this.entityManager.addPlayerEntity(playerCharacterId, socket);
    }

    public reconnectPlayer(userId: string, socket: Socket): void {
        // add a check to see if the player is reconnecting and if so replace the socket in the players array


    }

    public removePlayer(userId: string): void {

        // update this to remove player by UserId and not playerCharacterId
        
        // this.players = this.players.filter(p => p.playerCharacterId !== playerCharacterId);
        // const playerEntity = this.players.find(p => p.playerCharacterId === playerCharacterId);
        // if (playerEntity) {
        //     this.entityManager.removePlayerEntity(playerCharacterId);
        // }
    }

    // private joinPlayerToRooms(playerId: ObjectId, socket: Socket): void {
    //     // join the global world channel, then place the player in the world and join the appropriate channels (socket.io rooms)
    //     socket.join(SocketRooms.world.CHANNEL_NAME);
    // }

    // The tick method is the heartbeat of your simulation.
    private tick(): void {
        // Example: update entities, process queued events, update world time.
        // You can call world.updateEntities() or similar methods here.
        logger.debug(`Game loop tick at ${new Date().toISOString()}`);

        // For example:
        // this.world.updateEntities();
        
        // this.world.processGameEvents();
        // this.world.broadcastWorldState();
    }
}