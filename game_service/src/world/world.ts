import { Repositories } from "../db/index.js";
import { Socket, Server } from "socket.io";
import { logger } from '../util.js'
import { createClient, RedisClientType } from 'redis';
import { WithId, Document } from 'mongodb';
import { Entity, EntityState } from './entity.js';

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const enum RoomType {
    Room = 'room'
}

interface Room {
    id: string;
    dbRecord: Document;
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

    // Changed from arrays to Maps for efficient lookups.
    protected players: Map<string, { playerCharacter: any, socket: Socket }> = new Map();
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
                };
                // Changed: push entity into array instead of using Map.
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

    public addPlayer(playerCharacterId: string, playerCharacter: any, socket: Socket): void {
        // Add the player to the world using Map.
        this.players.set(playerCharacterId, { playerCharacter, socket });

        let playerEntity: Entity = {
            dbRecord: playerCharacter,
            pkid: playerCharacter._id.toString(),
            type: "player",
            lastUpdate: Date.now(),
            state: playerCharacter.saved_state,
            userId: playerCharacter.userId,
        };
        if (!playerEntity.state) {
            playerEntity.state = {
                room: "",
                roomDescription: "",
                health: 100,
                maxHealth: 100,
                location: "room-001",
                roomExits: [],
                roomItems: [],
                gameMessages: [],
            };
        }
        if (!playerEntity.state.gameMessages) {
            playerEntity.state.gameMessages = [];
        }
        playerEntity.state.gameMessages.push("You have joined the world of " + this.name);
        this.entities.push(playerEntity);
        this.arrivePlayer(playerEntity.pkid, playerCharacter.saved_state.location);
    }

    public reconnectPlayer(playerCharacterId: string, socket: Socket): void {
        // Changed: use array find instead of Map lookup.
        const player = this.players.get(playerCharacterId);
        if (!player) {
            throw new Error(`Player not found for user ID ${playerCharacterId}`);
        }
        player.socket = socket;
        //const playerEntity = this.entities.find(e => e.pkid === playerCharacterId); // not sure we need to do anything with entities here
    }

    public removePlayer(playerCharacterId: string, options?: {disconnected?: boolean, kicked?: boolean}): void {
        // Remove player from the Map.
        if (options) {
            // INCOMPLETE: Handle options for removing player
            if (options["disconnected"]) {
                // INCOMPLETE: Handle disconnected player timing out
                logger.info(`Player character ${playerCharacterId} removed from game world after grace period expired.`);
            }
            if (options["kicked"]) {
                // INCOMPLETE: Handle player being kicked
            }
        }
        this.players.delete(playerCharacterId);
        // Changed: filter out the matching entity.
        this.entities = this.entities.filter(entity => entity.pkid !== playerCharacterId);
    }

    // Used for when a player moves between rooms using a direction command (e.g., north, south, etc.)
    public movePlayer(playerCharacterId: string, direction: string): void {
        // lookup the player entity
        const entity = this.entities.find(e => e.pkid === playerCharacterId);
        if (entity !== undefined) {
            // lookup the location in the rooms array
            const room = this.rooms.find(r => r.id === entity.state!.location);
            if (!room) {
                throw new Error(`Room not found for location ${entity.state!.location}`);
            }
            if (room.dbRecord.exits[direction]) {
                const locationExit = room.dbRecord.exits[direction];
                const newRoom = this.rooms.find(r => r.id === locationExit.room_id);
                if (!newRoom) {
                    throw new Error(`Room not found for location ${locationExit.room_id}`);
                }
                entity.state!.location = locationExit.room_id;
                entity.state!.room = newRoom.dbRecord.name;
                entity.state!.roomDescription = newRoom.dbRecord.description;
                entity.state!.roomExits = newRoom.dbRecord.exits;
                entity.state!.gameMessages?.push(`You move ${direction} to ${newRoom.dbRecord.name}`);
            } else {
                entity.state!.gameMessages?.push(`You cannot move ${direction} from here.`);
            }
        } else {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }
    }

    // Used for when a player connects to a specific room in the world (e.g., on login)
    public arrivePlayer(playerCharacterId: string, location: string): void {
        // lookup the location in the rooms array
        const room = this.rooms.find(r => r.id === location);
        if (!room) {
            throw new Error(`Room not found for location ${location}`);
        }
        const entity = this.entities.find(e => e.pkid === playerCharacterId);
        if (entity !== undefined) {
            entity.state!.location = location;
            entity.state!.room = room.dbRecord.name;
            entity.state!.roomDescription = room.dbRecord.description;
            entity.state!.roomExits = room.dbRecord.exits;
            entity.state!.gameMessages?.push("You have entered the game.");
        } else {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }
    }

    private tick(): void {
        this.gatherInputs();
        this.updateWorldState();
        this.broadcastWorldState();
    }

    private gatherInputs(): void {
        // gather inputs from all connected players
        // for each player, gather the input
        for (const player of this.players.values()) {
            // gather the input from the player
            
        }
    }

    private updateWorldState(): void {
        // update the world state
        // for each room, update the state
        
    }

    private broadcastWorldState(): void {
        // Broadcast state by iterating over entities Map.
        this.entities.forEach(entity => {
            if (entity.type === "player") {
                const player = this.players.get(entity.pkid);
                if (player && entity.state) {
                    const newMessages: string[] = [];
                    // check for new game messages
                    //newMessages.push("tick");
                    entity.state.gameMessages!.push(...newMessages);
                    player.socket.emit('game:state_update', entity.state);
                }
            }
        });
    }

}
