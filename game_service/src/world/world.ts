import { Repositories } from "../db/index.js";
import { Socket, Server } from "socket.io";
import { logger } from '../util.js'
import { createClient, RedisClientType } from 'redis';
import { WithId, Document } from 'mongodb';
import { Entity, EntityState, EntityFactory, PlayerEntity } from './entity.js';

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const enum RoomType {
    Room = 'room'
}

interface Room {
    id: string;
    dbRecord: Document;
    type: RoomType;
    lastUpdate: number;
    roomEntities: string[];
    //update?(): void;
}

export class World {
    protected name: string;
    protected id: string;
    protected timer?: NodeJS.Timeout;
    private readonly tickRate = 1000 / 20; // 20 ticks per second; // 1 second

    //protected redis: RedisClientType;
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
        //this.redis = createClient({ url: REDIS_URL });
    }

    public async init(): Promise<void> {
        try {
            // load world rooms from database
            logger.info(`Initializing rooms service for world ${this.name}`);
            const roomsData = await this.repositories.roomRepository.listRoomsForWorld(this.id);
            for (const record of roomsData) {
                const room: Room = {
                    id: record._id.toString(),
                    dbRecord: record,
                    type: record.room_type,
                    roomEntities: [],
                    lastUpdate: Date.now(),
                };
                this.rooms.push(room);
            }

            // load world entities from database
            logger.info(`Initializing entities service for world ${this.name}`);
            const entitiesData = await this.repositories.entityRepository.listEntitiesForWorld(this.id);
            for (const record of entitiesData) {
                // Use EntityFactory to create properly typed entities
                const entity = EntityFactory.createEntity(record);
                this.entities.push(entity);
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

        // Create a player entity using the factory
        const playerEntity = EntityFactory.createPlayerEntity(playerCharacter);

        // Set initial state values if not already set by the factory
        if (playerEntity.state) {
            // Default values for new players
            if (!playerEntity.state.room) playerEntity.state.room = "";
            if (!playerEntity.state.roomDescription) playerEntity.state.roomDescription = "";
            if (!playerEntity.state.health) playerEntity.state.health = 100;
            if (!playerEntity.state.maxHealth) playerEntity.state.maxHealth = 100;
            if (!playerEntity.state.location) playerEntity.state.location = "room-001";
            if (!playerEntity.state.roomExits) playerEntity.state.roomExits = [];
            if (!playerEntity.state.roomItems) playerEntity.state.roomItems = [];
            if (!playerEntity.state.roomEntities) playerEntity.state.roomEntities = [];
            if (!playerEntity.state.gameMessages) playerEntity.state.gameMessages = [];

            // Add welcome message
            playerEntity.state.gameMessages.push("You have joined the world of " + this.name);
        }

        this.entities.push(playerEntity);
        this.arrivePlayer(playerEntity.pkid, playerEntity.state?.location || "room-001");
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

    public removePlayer(playerCharacterId: string, options?: { disconnected?: boolean, kicked?: boolean }): void {
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

            // check if the room has an exit in the specified direction
            if (room.dbRecord.exits[direction]) {
                const locationExit = room.dbRecord.exits[direction];
                const newRoom = this.rooms.find(r => r.id === locationExit.room_id);
                if (!newRoom) {
                    throw new Error(`Room not found for location ${locationExit.room_id}`);
                }

                // Get the movement type for messages
                const movementType = entity.getMovementTypeDescription();

                // Initialize visited rooms if not already set
                if (!entity.state!.visitedRooms) {
                    entity.state!.visitedRooms = new Set<string>();
                }
                
                // Mark both current and destination rooms as visited
                entity.state!.visitedRooms.add(entity.state!.location);
                entity.state!.visitedRooms.add(locationExit.room_id);
                
                // Initialize map data if not already set
                if (!entity.state!.mapData) {
                    entity.state!.mapData = { rooms: {} };
                }
                
                // Add or update current room in map data
                this.updateRoomInPlayerMap(entity, room);
                
                // Add or update destination room in map data
                this.updateRoomInPlayerMap(entity, newRoom);

                // Update entity state using the BaseEntity.updateState method
                entity.updateState({
                    location: locationExit.room_id,
                    room: newRoom.dbRecord.name,
                    roomDescription: newRoom.dbRecord.description,
                    roomExits: newRoom.dbRecord.exits,
                    roomEntities: this.getRoomEntities(locationExit.room_id).map(e => e.pkid)
                });

                // remove the player entity from the old room
                room.roomEntities = room.roomEntities.filter(e => e !== playerCharacterId);

                // add the player entity to the new room
                newRoom.roomEntities.push(playerCharacterId);

                // Add message to the player's message queue
                if (entity.state?.gameMessages) {
                    entity.state.gameMessages.push(`You ${movementType} ${direction} to ${newRoom.dbRecord.name}.`);
                }

                // push a message to players in the old room indicating the player moved
                for (const entityPkid of room.roomEntities) {
                    const otherEntity = this.entities.find(e => e.pkid === entityPkid);
                    if (otherEntity && otherEntity.state?.gameMessages) {
                        otherEntity.state.gameMessages.push(`${entity.state?.name} ${movementType}s ${direction}.`);
                    }
                }

                // push a message to players in the new room indicating the player arrived
                for (const entityPkid of newRoom.roomEntities) {
                    if (entityPkid !== playerCharacterId) { // Don't notify the arriving player
                        const otherEntity = this.entities.find(e => e.pkid === entityPkid);
                        if (otherEntity && otherEntity.state?.gameMessages) {
                            otherEntity.state.gameMessages.push(`${entity.state?.name} ${movementType}s in from the ${this.getOppositeDirection(direction)}.`);
                        }
                    }
                }

                // Send map update to player
                this.sendMapUpdateToPlayer(playerCharacterId);
            } else {
                if (entity.state?.gameMessages) {
                    entity.state.gameMessages.push(`You cannot move ${direction} from here.`);
                }
            }
        } else {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }
    }

    // Helper method to update a room in the player's map data
    private updateRoomInPlayerMap(entity: Entity, room: Room): void {
        if (!entity.state?.mapData) return;
        
        const roomId = room.id;
        const roomExits: Record<string, string> = {};
        
        // Format exits data for the map
        if (room.dbRecord.exits) {
            for (const [direction, exitInfo] of Object.entries(room.dbRecord.exits)) {
                if (exitInfo !== null && typeof exitInfo === 'object' && 'room_id' in exitInfo && typeof exitInfo.room_id === 'string') {
                    roomExits[direction] = exitInfo.room_id;
                }
            }
        }
        
        // Add or update the room in player's map data
        entity.state.mapData.rooms[roomId] = {
            id: roomId,
            name: room.dbRecord.name,
            exits: roomExits
        };
    }
    
    // Helper method to get the opposite direction
    private getOppositeDirection(direction: string): string {
        const opposites: Record<string, string> = {
            'north': 'south',
            'south': 'north',
            'east': 'west',
            'west': 'east',
            'up': 'down',
            'down': 'up',
            'northeast': 'southwest',
            'southwest': 'northeast',
            'northwest': 'southeast',
            'southeast': 'northwest',
            'in': 'out',
            'out': 'in'
        };
        
        return opposites[direction] || 'somewhere';
    }

    // Send map data update to player
    private sendMapUpdateToPlayer(playerCharacterId: string): void {
        const player = this.players.get(playerCharacterId);
        const entity = this.entities.find(e => e.pkid === playerCharacterId);
        
        if (player && entity && entity.state?.mapData) {
            const mapUpdateData = {
                rooms: entity.state.mapData.rooms,
                playerLocation: entity.state.location,
                visitedRooms: Array.from(entity.state.visitedRooms || [])
            };
            
            player.socket.emit('game:map_update', mapUpdateData);
        }
    }

    // Used for when a player connects to a specific room in the world (e.g., on login)
    public arrivePlayer(playerCharacterId: string, location: string): void {
        // lookup the location in the rooms array
        let room = this.rooms.find(r => r.id === location);
        if (!room) {
            throw new Error(`Room not found for location ${location}`);
        }
        let entity = this.entities.find(e => e.pkid === playerCharacterId);
        if (entity !== undefined) {
            // Initialize map-related properties
            if (!entity.state!.visitedRooms) {
                entity.state!.visitedRooms = new Set<string>();
            }
            if (!entity.state!.mapData) {
                entity.state!.mapData = { rooms: {} };
            }
            
            // Mark room as visited
            entity.state!.visitedRooms.add(location);
            
            // Add room to map data
            this.updateRoomInPlayerMap(entity, room);
            
            // Use updateState method for entity state changes
            entity.updateState({
                location: location,
                room: room.dbRecord.name,
                roomDescription: room.dbRecord.description,
                roomExits: room.dbRecord.exits,
                roomEntities: this.getRoomEntities(location).map(e => e.pkid)
            });

            if (entity.state?.gameMessages) {
                entity.state.gameMessages.push(`You have arrived in a ${room.dbRecord.name}.`);
            }
            room.roomEntities.push(playerCharacterId);
            
            // Send initial map data
            this.sendMapUpdateToPlayer(playerCharacterId);
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

    public sendCommandOutputToPlayer(playerCharacterId: string, messages: string[]): void {
        // Find the entity and use its methods
        const entity = this.entities.find(e => e.pkid === playerCharacterId);
        if (entity && entity.state?.gameMessages) {
            entity.state.gameMessages.push(...messages);
        }
    }

    // get all entities in a room
    private getRoomEntities(roomId: string): Entity[] {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            throw new Error(`Room not found for location ${roomId}`);
        }
        return this.entities.filter(e => room.roomEntities.includes(e.pkid));
    }

    public getPlayerName(playerCharacterId: string): string {
        const player = this.players.get(playerCharacterId);
        if (!player) {
            throw new Error(`Player not found for user ID ${playerCharacterId}`);
        }
        return player.playerCharacter.name;
    }

    public getPlayerSocketByName(playerName: string): Socket | undefined {
        for (const [_, playerData] of this.players.entries()) {
            if (playerData.playerCharacter.name === playerName) {
                return playerData.socket;
            }
        }
        return undefined;
    }

    public sayToRoom(playerCharacterId: string, message: string): void {
        // Find the player entity for the socket
        const player = this.players.get(playerCharacterId);
        if (!player) {
            throw new Error(`Player not found for user ID ${playerCharacterId}`);
        }
        const entity = this.entities.find(e => e.pkid === playerCharacterId);
        if (entity) {
            // Get the room entities
            const roomEntities = this.getRoomEntities(entity.state?.location || "");
            // Add the message to the player's game messages
            if (entity.state?.gameMessages) {
                entity.state.gameMessages.push(`You say, "${message}"`);
            }
            // Add the message to the other players' game messages
            for (const otherEntity of roomEntities) {
                if (otherEntity.pkid !== entity.pkid && otherEntity.state?.gameMessages) {
                    otherEntity.state.gameMessages.push(`${entity.state?.name} says, "${message}"`);
                }
            }
        }
    }

    // Add a command for changing movement type
    public changeMovementType(playerCharacterId: string, newMovementType: string): void {
        const entity = this.entities.find(e => e.pkid === playerCharacterId);
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }
        
        if (entity.setMovementType(newMovementType)) {
            if (entity.state?.gameMessages) {
                entity.state.gameMessages.push(`You are now ${newMovementType}ing.`);
            }
        } else {
            if (entity.state?.gameMessages) {
                entity.state.gameMessages.push(`You can't ${newMovementType}.`);
            }
        }
    }

    // FINISH UPDATING THIS TO USE ROOMS FIRST
    private broadcastWorldState(): void {
        // lets adjust this to instead update the state of each room and send the updated state to all players in the room
        // Broadcast state by iterating over rooms Map.
        // this.rooms.forEach(room => {
        //     // for each room, calculate the interactions between entities and update their states
        //     for (const entityPkid of room.roomEntities) {
        //         const entity = this.entities.find(e => e.pkid === entityPkid);
        //         if (entity) {
        //             // update the entity state
        //             //entity.state = this.updateEntityState(entity);
        //             // send the updated state to all players in the room
        //             for (const player of this.players.values()) {
        //                 player.socket.emit('game:state_update', entity.state);
        //             }
        //         }
        //     }
        // });

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
