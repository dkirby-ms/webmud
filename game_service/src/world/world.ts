import { Repositories } from "../db/index.js";
import { Socket, Server } from "socket.io";
import { logger, getOppositeDirection } from '../util.js'
import { WithId, Document } from 'mongodb';
import { Entity, EntityFactory, PlayerEntity, EntityClientView } from './entity.js';
import { MessageTypes } from "../taxonomy.js";
import { getEmoteByKey, EmoteDefinition } from "./emoteConfig.js";
import { CommandType } from "../commandParser.js";
import { EMOTE_KEYS } from "./emoteConfig.js";
import { isBigInt64Array } from "node:util/types";
import { RoundManager, CombatAction, RoundConfig, CombatResult } from "../game/combat/roundManager.js";

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
    private readonly tickRate = 1000 / 100; // 10 ticks per second; 1 tick = 100ms; 

    //protected redis: RedisClientType;
    protected socketServer: Server;
    protected repositories: Repositories;
    protected combatRoundManager: RoundManager;

    // Changed from arrays to Maps for efficient lookups.
    protected players: Map<string, { playerCharacter: any, socket: Socket }> = new Map();
    protected entities: Map<string, Entity> = new Map();
    protected rooms: Room[] = [];

    constructor(doc: WithId<Document>, repositories: Repositories, socketServer: Server) {
        // Initialize the world instance with the provided document, repositories, and socket server
        this.name = doc.name;
        this.id = doc._id.toHexString();
        this.repositories = repositories;
        this.socketServer = socketServer;
        //this.redis = createClient({ url: REDIS_URL });

        // Initialize combat round manager with test-friendly configuration
        const combatConfig: RoundConfig = {
            roundDurationMs: 8000,  // 8 second rounds for testing
            windowDurationMs: 4000  // 4 second action window for testing
        };
        
        // Callback for when combat ends due to defeats
        const onCombatEnd = (results: CombatResult[]) => {
            this.handleCombatEnd(results);
        };
        
        // Callback to get entities for combat processing
        const getEntities = () => this.entities;
        
        this.combatRoundManager = new RoundManager(combatConfig, onCombatEnd, getEntities);
    }

    // init the world from the database 
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
                if (entity.type === "player") {
                    this.entities.set(entity.pkid, entity);
                } else {
                    // Handle other entity types (mobs, NPCs, items)
                    if (entity.baseData.id) {
                        this.entities.set(entity.baseData.id, entity);
                        
                        // Place non-player entities in their assigned rooms
                        const roomId = record.room_id || entity.baseData.defaultLocation;
                        if (roomId) {
                            const room = this.rooms.find(r => r.id === roomId);
                            if (room) {
                                room.roomEntities.push(entity.baseData.id);
                                logger.info(`Placed ${entity.type} '${entity.baseData.name}' in room ${roomId}`);
                            } else {
                                logger.warn(`Room ${roomId} not found for entity ${entity.baseData.id}`);
                            }
                        }
                    } else {
                        logger.warn(`Entity without ID found: ${JSON.stringify(entity)}`);
                    }
                }
            }

        } catch (err) {
            throw (`Error initializing game world: ${err}`);
        }

    }

    // start the game world loop
    public start(): void {
        try {
            this.timer = setInterval(() => this.tick(), this.tickRate);
            
            // Don't auto-start combat - it should start when needed
            // this.combatRoundManager.start();
            
            logger.info(`World ${this.name} started.`);
        } catch (err) {
            logger.error(`Error initializing game world: ${err}`);
            return;
        }
    }

    // stop the game world loop
    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            logger.info(`Game world stopped.`);
        }
        
        // Stop the combat round manager
        this.combatRoundManager.stop();
    }

    
    // Add a player to the world as an entity
    public addPlayer(playerCharacterId: string, playerCharacter: any, socket: Socket): void {
        // Add the player to the world using Map.
        this.players.set(playerCharacterId, { playerCharacter, socket });

        // Create a player entity using the factory
        const playerEntity = EntityFactory.createPlayerEntity(playerCharacter);

        // Set initial state values if not already set by the factory
        // Default values for new players - use updateState method
        const initialState: any = {};
        if (!playerEntity.state.currentRoom) initialState.currentRoom = "";
        if (!playerEntity.state.roomDescription) initialState.roomDescription = "";
        if (!playerEntity.state.currentHealth) initialState.currentHealth = 100;
        if (!playerEntity.state.gameMessages) initialState.gameMessages = [];
        if (!playerEntity.state.currentLocation) initialState.currentLocation = "room-001";
        if (!playerEntity.state.roomExits) initialState.roomExits = [];
        if (!playerEntity.state.roomItems) initialState.roomItems = [];
        if (!playerEntity.state.roomEntityStates) initialState.roomEntityStates = [];

        // Apply initial state using updateState method
        if (Object.keys(initialState).length > 0) {
            playerEntity.updateState(initialState);
        }

        // Add welcome message using updateState method
        if (playerEntity.state?.gameMessages) {
            const currentMessages = [...playerEntity.state.gameMessages];
            currentMessages.push("You have joined the world of " + this.name);
            playerEntity.updateState({ gameMessages: currentMessages });
        }

        this.entities.set(playerEntity.pkid, playerEntity);
        this.arrivePlayer(playerEntity.pkid, playerEntity.state.currentLocation || "room-001");
    }

    // reconnect a disconnected player
    public reconnectPlayer(playerCharacterId: string, socket: Socket): void {
        // Changed: use array find instead of Map lookup.
        const player = this.players.get(playerCharacterId);
        if (!player) {
            throw new Error(`Player not found for user ID ${playerCharacterId}`);
        }
        player.socket = socket;
        const playerEntity = this.entities.get(playerCharacterId); // not sure we need to do anything with entities here
    }

    // remove a player from the world
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
        this.entities.delete(playerCharacterId);
    }

    // Used for when a player moves between rooms using a direction command (e.g., north, south, etc.)
    public movePlayer(playerCharacterId: string, direction: string): void {
        // lookup the player entity
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (entity !== undefined) {
            // lookup the location in the rooms array
            const room = this.rooms.find(r => r.id === entity.state.currentLocation);
            if (!room) {
                throw new Error(`Room not found for location ${entity.state.currentLocation}`);
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
                if (!entity.state.visitedRooms) {
                    entity.updateState({ visitedRooms: new Set<string>() });
                }

                // Mark both current and destination rooms as visited
                const newVisitedRooms = new Set(entity.state.visitedRooms);
                newVisitedRooms.add(entity.state.currentLocation);
                newVisitedRooms.add(locationExit.room_id);

                // Initialize map data if not already set
                if (!entity.state.mapData) {
                    entity.updateState({ mapData: { rooms: {} } });
                }

                // Add or update current room in map data
                this.updateRoomInPlayerMap(entity, room);

                // Add or update destination room in map data
                this.updateRoomInPlayerMap(entity, newRoom);

                // Update entity state using the BaseEntity.updateState method
                entity.updateState({
                    currentLocation: locationExit.room_id,
                    currentRoom: newRoom.dbRecord.name,
                    roomDescription: newRoom.dbRecord.description,
                    roomExits: newRoom.dbRecord.exits,
                    roomEntityViews: this.getRoomEntityViews(locationExit.room_id, playerCharacterId),
                    visitedRooms: newVisitedRooms
                });

                // remove the player entity from the old room
                room.roomEntities = room.roomEntities.filter(e => e !== playerCharacterId);

                // add the player entity to the new room
                newRoom.roomEntities.push(playerCharacterId);

                // Add message to the player's message queue
                if (entity.state?.gameMessages) {
                    const currentMessages = [...entity.state.gameMessages];
                    currentMessages.push(`You ${movementType} ${direction} to ${newRoom.dbRecord.name}.`);
                    entity.updateState({ gameMessages: currentMessages });
                }

                // push a message to players in the old room indicating the player moved
                for (const entityPkid of room.roomEntities) {
                    const otherEntity = this.entities.get(entityPkid) as PlayerEntity;
                    if (otherEntity && otherEntity.state?.gameMessages) {
                        const currentMessages = [...otherEntity.state.gameMessages];
                        currentMessages.push(`${entity.baseData.name} ${movementType}s ${direction}.`);
                        otherEntity.updateState({ gameMessages: currentMessages });
                    }
                }

                // push a message to players in the new room indicating the player arrived
                for (const entityPkid of newRoom.roomEntities) {
                    if (entityPkid !== playerCharacterId) { // Don't notify the arriving player
                        const otherEntity = this.entities.get(entityPkid) as PlayerEntity;
                        if (otherEntity && otherEntity.state?.gameMessages) {
                            const currentMessages = [...otherEntity.state.gameMessages];
                            currentMessages.push(`${entity.baseData.name} ${movementType}s in from ${getOppositeDirection(direction)}.`);
                            otherEntity.updateState({ gameMessages: currentMessages });
                        }
                    }
                }

                // Send map update to player
                this.sendMapUpdateToPlayer(playerCharacterId);

                // Send room state to player
                this.sendStateToPlayer(playerCharacterId, locationExit.room_id);
            } else {
                if (entity.state?.gameMessages) {
                    const currentMessages = [...entity.state.gameMessages];
                    currentMessages.push(`You cannot move ${direction} from here.`);
                    entity.updateState({ gameMessages: currentMessages });
                }
            }
        } else {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }
    }

    // Helper method to update a room in the player's map data
    private updateRoomInPlayerMap(entity: PlayerEntity, room: Room): void {
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
        const currentMapData = { ...entity.state.mapData };
        currentMapData.rooms[roomId] = {
            id: roomId,
            name: room.dbRecord.name,
            exits: roomExits
        };
        entity.updateState({ mapData: currentMapData });
    }

    // advance the game loop - one tick represents 1/20th of a second at the current tick rate
    private tick(): void {
        this.gatherInputs();
        this.updateWorldState();
        this.broadcastClientViews();
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
        for (const room of this.rooms) {
            // update the room state
            room.lastUpdate = Date.now();
            // update the entities in the room if needed
            const roomEntities = this.getRoomEntities(room.id);
            for (const entity of roomEntities) {
                // update the entity state if needed
                if (entity.state) {
                    // perform any necessary updates to the entity state
                    entity.lastUpdate = Date.now();
                }
            }
        }
    }

    // FINISH UPDATING THIS TO USE ROOMS FIRST
    private broadcastClientViews(): void {
        this.rooms.forEach(room => {
            // WARNING!! at some point the order the entities iterate through will matter
            const roomEntities = this.getRoomEntities(room.id);
            
            // Send each player their complete client view
            roomEntities.forEach(entity => {
                if (entity.type === "player") {
                    // Get the player's socket
                    const player = this.players.get(entity.pkid);
                    if (player && player.socket) {
                        // Get room entity views excluding the current player
                        const roomEntityViews = roomEntities
                            .filter(e => e.pkid !== entity.pkid)  // Exclude this player
                            .map(e => e.toClientView());
                        
                        // Update the player's state with room entity views
                        entity.updateState({
                            roomEntityViews
                        });
                        
                        // Get the complete client view
                        const clientView = entity.toClientView();
                        
                        // Send the complete client view
                        player.socket.emit(MessageTypes.game.GAME_STATE_UPDATE, clientView);
                    }
                }
            });
        });
    }

    public sendCommandOutputToPlayer(playerCharacterId: string, messages: string[]): void {
        // Find the entity and use its methods
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (entity && entity.state?.gameMessages) {
            const currentMessages = [...entity.state.gameMessages];
            currentMessages.push(...messages);
            entity.updateState({ gameMessages: currentMessages });
        }
    }

    // get all entities in a room
    private getRoomEntities(roomId: string): Entity[] {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            throw new Error(`Room not found for location ${roomId}`);
        }
        return Array.from(this.entities.values()).filter(e => {
            // For player entities, check against pkid
            if (e.type === "player") {
                return room.roomEntities.includes(e.pkid);
            } else {
                // For non-player entities (mobs, NPCs), check against baseData.id
                return e.baseData.id && room.roomEntities.includes(e.baseData.id);
            }
        });
    }

    // Update the getRoomEntityViews method to exclude a specific player
    private getRoomEntityViews(roomId: string, excludePlayerPkid?: string): EntityClientView[] {
        const roomEntities = this.getRoomEntities(roomId);
        return roomEntities
            .filter(entity => entity.pkid !== excludePlayerPkid)  // Filter out the excluded player
            .map(entity => entity.toClientView());
    }

    public getPlayerName(playerCharacterId: string): string {
        const player = this.players.get(playerCharacterId);
        if (!player) {
            throw new Error(`Player not found for user ID ${playerCharacterId}`);
        }
        const playerEntity = this.entities.get(playerCharacterId);
        return player.playerCharacter.name;
    }

    public getPlayerSocketByName(playerName: string): Socket | undefined {
        for (const [_, playerData] of this.players.entries()) {
            if (playerData.playerCharacter.name.toLowerCase() === playerName.toLowerCase()) {
                return playerData.socket;
            }
        }
        return undefined;
    }

    // Send map data update to player
    private sendMapUpdateToPlayer(playerCharacterId: string): void {
        const player = this.players.get(playerCharacterId);
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;

        if (player && entity && entity.state?.mapData) {
            const mapUpdateData = {
                rooms: entity.state.mapData.rooms,
                playerLocation: entity.state.currentLocation,
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
        let entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (entity !== undefined) {
            // Initialize map-related properties
            if (!entity.state.visitedRooms) {
                entity.updateState({ visitedRooms: new Set<string>() });
            }
            if (!entity.state.mapData) {
                entity.updateState({ mapData: { rooms: {} } });
            }

            // Mark room as visited
            const newVisitedRooms = new Set(entity.state.visitedRooms);
            newVisitedRooms.add(location);

            // Add room to map data
            this.updateRoomInPlayerMap(entity, room);

            // Use updateState method for entity state changes
            entity.updateState({
                currentLocation: location,
                currentRoom: room.dbRecord.name,
                roomDescription: room.dbRecord.description,
                roomExits: room.dbRecord.exits,
                roomEntityViews: this.getRoomEntityViews(location, playerCharacterId),
                visitedRooms: newVisitedRooms
            });

            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                currentMessages.push(`You have arrived in a ${room.dbRecord.name}.`);
                entity.updateState({ gameMessages: currentMessages });
            }
            
            // Notify other entities in the room about the new arrival
            const roomEntities = this.getRoomEntities(location);
            for (const roomEntity of roomEntities) {
                if (roomEntity.pkid !== playerCharacterId && roomEntity.state?.gameMessages) {
                    const currentMessages = [...roomEntity.state.gameMessages];
                    currentMessages.push(`${entity.baseData.name} has arrived, seemingly from nowhere.`);
                    roomEntity.updateState({ gameMessages: currentMessages });
                }
            }
            
            // Add player to the room entities
            room.roomEntities.push(playerCharacterId);

            // Send initial map data
            this.sendMapUpdateToPlayer(playerCharacterId);

            // Send room state to player
            this.sendStateToPlayer(playerCharacterId, location);
        } else {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }
    }

    public sayToRoom(playerCharacterId: string, message: string): void {
        // Find the player entity for the socket
        const player = this.players.get(playerCharacterId);
        if (!player) {
            throw new Error(`Player not found for user ID ${playerCharacterId}`);
        }
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (entity) {
            // Get the room entities
            const roomEntities = this.getRoomEntities(entity.state.currentLocation || "");
            // Add the message to the player's game messages
            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                currentMessages.push(`You say, "${message}"`);
                entity.updateState({ gameMessages: currentMessages });
            }
            // Add the message to the other entities' game messages
            for (const roomEntity of roomEntities) {
                if (roomEntity.pkid !== playerCharacterId && roomEntity.state?.gameMessages) {
                    const currentMessages = [...roomEntity.state.gameMessages];
                    currentMessages.push(`${entity.baseData.name} says, "${message}"`);
                    roomEntity.updateState({ gameMessages: currentMessages });
                }
            }
        }
    }

    // Add a command for changing movement type
    public changeMovementType(playerCharacterId: string, newMovementType: string): void {
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }

        if (entity.setMovementType(newMovementType)) {
            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                currentMessages.push(`You are now ${newMovementType}ing.`);
                entity.updateState({ gameMessages: currentMessages });
            }
        } else {
            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                currentMessages.push(`You can't ${newMovementType}.`);
                entity.updateState({ gameMessages: currentMessages });
            }
        }
    }

    // Modify the emoteToRoom method to use the emote config
    public emoteToRoom(playerCharacterId: string, emoteAction: string, target?: string): void {
        // Find the player entity
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }

        // Get the current room entities
        const roomEntities = this.getRoomEntities(entity.state.currentLocation || "");
        
        // Find the emote definition if it exists, otherwise use generic format
        const emote = getEmoteByKey(emoteAction);
        
        // Format the messages
        let playerMessage = "";
        let othersMessage = "";
        let targetMessage = "";
        
        // Check if this is a targeted emote
        if (target) {
            // Find the target entity in the room
            const targetEntity = roomEntities.find(e => 
                e.baseData.name.toLowerCase() === target.toLowerCase());
            
            if (targetEntity) {
                // Target found in the room
                if (emote) {
                    // Use the predefined emote texts
                    playerMessage = emote.targetSelfText.replace("{target}", targetEntity.baseData.name);
                    othersMessage = emote.targetOthersText
                        .replace("{name}", entity.baseData.name)
                        .replace("{target}", targetEntity.baseData.name);
                    targetMessage = emote.targetReceiverText.replace("{name}", entity.baseData.name);
                } else {
                    // Use generic format for custom emotes
                    playerMessage = `You ${emoteAction} at ${targetEntity.baseData.name}.`;
                    othersMessage = `${entity.baseData.name} ${emoteAction}s at ${targetEntity.baseData.name}.`;
                    targetMessage = `${entity.baseData.name} ${emoteAction}s at you.`;
                }
                
                // If the target is a player, send them the special message
                if (targetEntity.type === "player") {
                    const targetPlayer = this.entities.get(targetEntity.pkid) as PlayerEntity;
                    if (targetPlayer && targetPlayer.state?.gameMessages) {
                        const currentMessages = [...targetPlayer.state.gameMessages];
                        currentMessages.push(targetMessage);
                        targetPlayer.updateState({ gameMessages: currentMessages });
                    }
                }
            } else {
                // Target not found, fall back to untargeted emote with mention
                playerMessage = `You ${emoteAction} at ${target}, but they are not here.`;
                othersMessage = `${entity.baseData.name} ${emoteAction}s at ${target}, but they are not here.`;
            }
        } else {
            // Untargeted emote
            if (emote) {
                // Use the predefined emote texts
                playerMessage = emote.selfText;
                othersMessage = emote.othersText.replace("{name}", entity.baseData.name);
            } else {
                // Use generic format for custom emotes
                playerMessage = `You ${emoteAction}.`;
                othersMessage = `${entity.baseData.name} ${emoteAction}s.`;
            }
        }
        
        // Add the message to the player's game messages
        if (entity.state?.gameMessages) {
            const currentMessages = [...entity.state.gameMessages];
            currentMessages.push(playerMessage);
            entity.updateState({ gameMessages: currentMessages });
        }
        
        // Add the message to other entities in the room
        for (const roomEntity of roomEntities) {
            // Skip the originating player and the target (who gets a special message)
            if (roomEntity.pkid !== playerCharacterId && 
                (!target || roomEntity.baseData.name.toLowerCase() !== target.toLowerCase()) && 
                roomEntity.state?.gameMessages) {
                const currentMessages = [...roomEntity.state.gameMessages];
                currentMessages.push(othersMessage);
                roomEntity.updateState({ gameMessages: currentMessages });
            }
        }
    }

    // send the current state of the room to the specified player - in the future this could be used for scrying or other effects 
    public sendStateToPlayer(playerCharacterId: string, roomId: string): void {
        const player = this.players.get(playerCharacterId);
        if (!player) {
            throw new Error(`Player not found for user ID ${playerCharacterId}`);
        }

        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            throw new Error(`Room not found for location ${roomId}`);
        }

        // get the player's current state
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }

        // Update the player's state with room entity views
        const roomEntityViews = this.getRoomEntityViews(roomId, playerCharacterId);
        entity.updateState({
            roomEntityViews
        });

        // Send the complete client view
        player.socket.emit('game:state_update', entity.toClientView());
    }

    // Display help information to a player
    public displayHelp(playerCharacterId: string, args?: string[]): void {
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }

        if (args && args.length > 0) {
            // Show detailed help for a specific command
            this.displaySpecificHelp(playerCharacterId, args[0]);
            return;
        }

        // Generate general help message with all available commands
        const helpMessages: string[] = [];
        
        helpMessages.push("=== AVAILABLE COMMANDS ===");
        helpMessages.push("");
        
        // Movement commands
        helpMessages.push("MOVEMENT:");
        helpMessages.push("  north (n), south (s), east (e), west (w), up (u), down (d)");
        
        // Basic commands
        helpMessages.push("");
        helpMessages.push("BASIC COMMANDS:");
        helpMessages.push("  look (l) - Look at your surroundings or a specific thing");
        helpMessages.push("  look map - View the map of areas you've visited");
        helpMessages.push("  say <message> - Say something to everyone in the room");
        helpMessages.push("  tell <player> <message> - Send a private message to another player");
        helpMessages.push("  help (h) - Show this help message");
        helpMessages.push("  help <command> - Show detailed help for a specific command");
        
        // Combat commands
        helpMessages.push("");
        helpMessages.push("COMBAT:");
        helpMessages.push("  attack (a), kill (k) <target> - Queue attack for next combat round");
        helpMessages.push("  flee - Attempt to flee from combat");
        helpMessages.push("  combat - Show combat round status and timing");
        
        // Emotes
        helpMessages.push("");
        helpMessages.push("EMOTES:");
        const emoteList = EMOTE_KEYS.join(", ");
        const emoteChunks = this.chunkString(emoteList, 60);
        helpMessages.push("  " + emoteChunks.join("\n  "));
        helpMessages.push("  <emote> <target> - Direct an emote at someone (e.g., 'smile John')");
        
        this.sendCommandOutputToPlayer(playerCharacterId, helpMessages);
    }
    
    // Helper method to display detailed help for a specific command
    private displaySpecificHelp(playerCharacterId: string, command: string): void {
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }
        
        const helpMessages: string[] = [];
        command = command.toLowerCase();
        
        switch (command) {
            case "move":
            case "north":
            case "south":
            case "east":
            case "west":
            case "up":
            case "down":
            case "n":
            case "s":
            case "e":
            case "w":
            case "u":
            case "d":
                helpMessages.push("=== MOVEMENT ===");
                helpMessages.push("Use direction commands to move your character around the world.");
                helpMessages.push("Commands: north (n), south (s), east (e), west (w), up (u), down (d)");
                helpMessages.push("Example: 'north' or just 'n' to move north");
                break;
                
            case "say":
                helpMessages.push("=== SAY ===");
                helpMessages.push("Say something to all players in your current location.");
                helpMessages.push("Usage: say <message>");
                helpMessages.push("Example: 'say Hello everyone!'");
                break;
                
            case "tell":
                helpMessages.push("=== TELL ===");
                helpMessages.push("Send a private message to another player.");
                helpMessages.push("Usage: tell <player> <message>");
                helpMessages.push("Example: 'tell John How are you doing?'");
                break;
                                
            case "attack":
            case "kill":
            case "a":
            case "k":
                helpMessages.push("=== ATTACK ===");
                helpMessages.push("Queue an attack action for the next combat round resolution.");
                helpMessages.push("Usage: attack <target> or kill <target>");
                helpMessages.push("Example: 'attack goblin' or 'kill orc'");
                helpMessages.push("Note: Actions are only accepted during open combat windows.");
                helpMessages.push("Use 'combat' command to check round status and timing.");
                break;
                
            case "combat":
                helpMessages.push("=== COMBAT STATUS ===");
                helpMessages.push("Display the current combat round status and timing.");
                helpMessages.push("Shows whether the action window is open or closed,");
                helpMessages.push("time remaining in current window, and queued actions.");
                helpMessages.push("Usage: combat");
                break;
                
            case "flee":
            case "run":
                helpMessages.push("=== FLEE ===");
                helpMessages.push("Attempt to escape from combat.");
                helpMessages.push("When successful, you will exit combat immediately.");
                helpMessages.push("If all players flee, combat will end automatically.");
                helpMessages.push("Usage: flee");
                helpMessages.push("Note: Currently flee always succeeds, but this may change.");
                break;
                
            case "emote":
                helpMessages.push("=== EMOTES ===");
                helpMessages.push("Express your character's actions and emotions.");
                helpMessages.push("Available emotes: " + EMOTE_KEYS.join(", "));
                helpMessages.push("Usage: <emote> [target]");
                helpMessages.push("Examples:");
                helpMessages.push("  'smile' - You smile happily");
                helpMessages.push("  'bow John' - You bow respectfully to John");
                break;
                
            case "help":
            case "h":
                helpMessages.push("=== HELP ===");
                helpMessages.push("Display help information about commands.");
                helpMessages.push("Usage: help [command]");
                helpMessages.push("Examples:");
                helpMessages.push("  'help' - Show list of all commands");
                helpMessages.push("  'help tell' - Show detailed help about the tell command");
                break;
                
            default:
                // Check if it's an emote
                if (EMOTE_KEYS.includes(command)) {
                    const emote = getEmoteByKey(command);
                    helpMessages.push(`=== EMOTE: ${command.toUpperCase()} ===`);
                    helpMessages.push(`Without target: ${emote?.selfText}`);
                    helpMessages.push(`With target: ${emote?.targetSelfText.replace("{target}", "someone")}`);
                    helpMessages.push("");
                    helpMessages.push(`Usage: ${command} [target]`);
                    helpMessages.push(`Example: '${command} John'`);
                } else {
                    helpMessages.push(`No help available for '${command}'.`);
                    helpMessages.push("Type 'help' for a list of all commands.");
                }
                break;
        }
        
        this.sendCommandOutputToPlayer(playerCharacterId, helpMessages);
    }
    
    public playerLooksAt(playerCharacterId: string, args?: string[]): void {
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }
        const room = this.rooms.find(r => r.id === entity.state.currentLocation);
        if (!room) {
            throw new Error(`Room not found for location ${entity.state.currentLocation}`);
        }
        if (args && args.length > 0) {
            // Look at a specific object or entity
            const targetName = args.join(" ").toLowerCase();
            
            // Get all entities in the room
            const roomEntities = this.getRoomEntities(entity.state.currentLocation || "");
            
            // Find the entity by name instead of by ID
            const targetEntity = roomEntities.find(e => 
                e.baseData.name.toLowerCase() === targetName);
            
            if (targetEntity) {
                // Target found - notify them and the looking player
                if (targetEntity.type === "player" && targetEntity.state?.gameMessages) {
                    const currentMessages = [...targetEntity.state.gameMessages];
                    currentMessages.push(`${entity.baseData.name} looks at you.`);
                    targetEntity.updateState({ gameMessages: currentMessages });
                }
                
                if (entity.state?.gameMessages) {
                    const currentMessages = [...entity.state.gameMessages];
                    currentMessages.push(`You look at ${targetEntity.baseData.name}.`);
                    entity.updateState({ gameMessages: currentMessages });
                }
            } else {
                if (entity.state?.gameMessages) {
                    const currentMessages = [...entity.state.gameMessages];
                    currentMessages.push(`You don't see ${args.join(" ")} here.`);
                    entity.updateState({ gameMessages: currentMessages });
                }
            }
        } else {
            // Look at the room
            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                currentMessages.push(`You look around the ${room.dbRecord.name}.`);
                currentMessages.push(room.dbRecord.description);
                if (room.dbRecord.exits) {
                    currentMessages.push("Exits: " + Object.keys(room.dbRecord.exits).join(", "));
                }
                if (room.roomEntities.length > 0) {
                    const entityNames = room.roomEntities
                        .filter(id => id !== playerCharacterId) // Exclude the looking player
                        .map(id => {
                            const entity = this.entities.get(id);
                            return entity ? entity.baseData.name : id;
                        });
                    
                    if (entityNames.length > 0) {
                        currentMessages.push("You see: " + entityNames.join(", "));
                    } else {
                        currentMessages.push("You don't see anyone else here.");
                    }
                }
                entity.updateState({ gameMessages: currentMessages });
            }
        }
    }


    // Handle attack and kill commands with combat round system
    public handleCombatCommand(playerCharacterId: string, target?: string): void {
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }

        // If no target specified, just display combat status
        if (!target) {
            this.displayCombatStatus(playerCharacterId);
            return;
        }

        // Find the target entity in the current room
        const roomEntities = this.getRoomEntities(entity.state.currentLocation || "");
        const targetEntity = roomEntities.find(e => 
            e.baseData.name.toLowerCase() === target.toLowerCase());

        if (!targetEntity) {
            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                currentMessages.push(`You don't see ${target} here.`);
                entity.updateState({ gameMessages: currentMessages });
            }
            return;
        }

        // Check if target can be attacked (not another player for now)
        if (targetEntity.type === "player") {
            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                currentMessages.push(`You cannot attack other players.`);
                entity.updateState({ gameMessages: currentMessages });
            }
            return;
        }

        // If combat round system is not active, start it automatically
        if (!this.combatRoundManager.getCurrentState().isActive) {
            this.combatRoundManager.start();
            
            // Notify all entities in the room that combat has started
            for (const roomEntity of roomEntities) {
                if (roomEntity.type === "player" && roomEntity.state?.gameMessages) {
                    const currentMessages = [...roomEntity.state.gameMessages];
                    currentMessages.push(`*** COMBAT INITIATED ***`);
                    currentMessages.push(`${entity.baseData.name} attacks ${targetEntity.baseData.name}!`);
                    roomEntity.updateState({ gameMessages: currentMessages });
                }
            }
        }
        
        // Check if combat round system window is open
        if (!this.combatRoundManager.isWindowOpen()) {
            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                const timeRemaining = this.combatRoundManager.getWindowTimeRemaining();
                if (timeRemaining > 0) {
                    currentMessages.push(`Action window is closed. Next window opens in ${Math.ceil(timeRemaining / 1000)} seconds.`);
                } else {
                    currentMessages.push("Combat action window is currently closed. Wait for the next round.");
                }
                entity.updateState({ gameMessages: currentMessages });
            }
            return;
        }

        // Create combat action
        const combatAction: CombatAction = {
            playerId: playerCharacterId,
            actionType: 'attack',
            target: target
        };

        // Queue the action
        const queued = this.combatRoundManager.queueAction(combatAction);
        
        if (entity.state?.gameMessages) {
            const currentMessages = [...entity.state.gameMessages];
            if (queued) {
                const timeRemaining = this.combatRoundManager.getWindowTimeRemaining();
                currentMessages.push(`You prepare to attack ${targetEntity.baseData.name}. Action queued for next resolution (${Math.ceil(timeRemaining / 1000)}s remaining).`);
            } else {
                currentMessages.push("Unable to queue combat action at this time.");
            }
            entity.updateState({ gameMessages: currentMessages });
        }
    }

    // Handle flee command - allows players to escape from combat
    public handleFleeCommand(playerCharacterId: string): void {
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }

        // Check if combat is active
        if (!this.combatRoundManager.getCurrentState().isActive) {
            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                currentMessages.push("You are not in combat.");
                entity.updateState({ gameMessages: currentMessages });
            }
            return;
        }

        // Get current room entities to notify them
        const roomEntities = this.getRoomEntities(entity.state.currentLocation || "");

        // Notify all entities in the room about the flee attempt
        for (const roomEntity of roomEntities) {
            if (roomEntity.type === "player" && roomEntity.state?.gameMessages) {
                const currentMessages = [...roomEntity.state.gameMessages];
                if (roomEntity.pkid === playerCharacterId) {
                    currentMessages.push("You attempt to flee from combat!");
                } else {
                    currentMessages.push(`${entity.baseData.name} attempts to flee from combat!`);
                }
                roomEntity.updateState({ gameMessages: currentMessages });
            }
        }

        // For now, fleeing always succeeds - you could add failure chance here
        const fleeSuccess = true; // Math.random() > 0.3; // 70% success rate

        if (fleeSuccess) {
            // Get available exits for fleeing
            const currentRoom = this.rooms.find(r => r.id === entity.state.currentLocation);
            const availableExits = currentRoom?.dbRecord.exits ? Object.keys(currentRoom.dbRecord.exits) : [];
            const originalRoomId = entity.state.currentLocation;
            
            // Flee successful - notify room and possibly move to random exit
            for (const roomEntity of roomEntities) {
                if (roomEntity.type === "player" && roomEntity.state?.gameMessages) {
                    const currentMessages = [...roomEntity.state.gameMessages];
                    if (roomEntity.pkid === playerCharacterId) {
                        currentMessages.push("You successfully flee from combat!");
                    } else {
                        currentMessages.push(`${entity.baseData.name} flees from combat!`);
                    }
                    roomEntity.updateState({ gameMessages: currentMessages });
                }
            }
            
            // Move player to a random adjacent room if exits are available
            if (availableExits.length > 0) {
                const randomExit = availableExits[Math.floor(Math.random() * availableExits.length)];
                
                // Use the existing movePlayer method to handle the movement
                this.movePlayer(playerCharacterId, randomExit);
                
                // Add additional flee message
                if (entity.state?.gameMessages) {
                    const currentMessages = [...entity.state.gameMessages];
                    currentMessages.push(`You flee ${randomExit} to escape!`);
                    entity.updateState({ gameMessages: currentMessages });
                }
            }

            // Check if all players have fled from the original room - if so, end combat
            const playersInOriginalRoom = this.getRoomEntities(originalRoomId || "")
                .filter(e => e.type === "player");
            if (playersInOriginalRoom.length === 0) {
                this.endCombat("All participants have fled from combat.");
            }
        } else {
            // Flee failed
            if (entity.state?.gameMessages) {
                const currentMessages = [...entity.state.gameMessages];
                currentMessages.push("You fail to flee from combat!");
                entity.updateState({ gameMessages: currentMessages });
            }
        }
    }

    // End combat with a specific reason
    private endCombat(reason: string): void {
        if (!this.combatRoundManager.getCurrentState().isActive) {
            return;
        }

        // Stop the combat round manager
        this.combatRoundManager.stop();

        // Notify all players in all rooms that combat has ended
        this.rooms.forEach(room => {
            const roomEntities = this.getRoomEntities(room.id);
            for (const entity of roomEntities) {
                if (entity.type === "player" && entity.state?.gameMessages) {
                    const currentMessages = [...entity.state.gameMessages];
                    currentMessages.push("*** COMBAT ENDED ***");
                    currentMessages.push(reason);
                    entity.updateState({ gameMessages: currentMessages });
                }
            }
        });

        logger.info(`Combat ended: ${reason}`);
    }

    /**
     * Handles combat end due to defeats - called by round manager
     */
    private handleCombatEnd(results: CombatResult[]): void {
        if (!this.combatRoundManager.getCurrentState().isActive) {
            return;
        }

        // Find defeated entities
        const defeatedEntities = results
            .filter(result => result.defeated)
            .map(result => result.target);

        if (defeatedEntities.length === 0) {
            return;
        }

        // Send combat messages to all players in affected rooms
        const affectedRooms = new Set<string>();
        
        for (const result of results) {
            if (result.defeated) {
                const defenderEntity = this.entities.get(result.target);
                const attackerEntity = this.entities.get(result.attacker);
                
                if (defenderEntity && attackerEntity) {
                    const defenderName = defenderEntity.getName();
                    const attackerName = attackerEntity.getName();
                    const roomId = defenderEntity.state.currentLocation;
                    
                    affectedRooms.add(roomId);
                    
                    // Send combat damage message to players in the room
                    this.sendToPlayersInRoom(roomId, MessageTypes.combat.DAMAGE, {
                        message: `${defenderName} has been defeated by ${attackerName}!`,
                        attacker: attackerName,
                        defender: defenderName,
                        damage: result.damage,
                        defeated: true
                    });
                }
            }
        }

        // End combat with appropriate message
        const defeatedNames = defeatedEntities
            .map(entityId => {
                const entity = this.entities.get(entityId);
                return entity?.getName() || 'Unknown';
            })
            .join(', ');

        this.endCombat(`Combat ended: ${defeatedNames} defeated.`);
    }

    /**
     * Sends a message to all players in a specific room
     */
    private sendToPlayersInRoom(roomId: string, messageType: string, data: any): void {
        for (const [playerId, player] of this.players.entries()) {
            const playerEntity = this.entities.get(playerId);
            if (playerEntity && playerEntity.state.currentLocation === roomId) {
                player.socket.emit(messageType, data);
            }
        }
    }

    // Helper method to chunk a string into smaller pieces
    private chunkString(str: string, length: number): string[] {
        const chunks = [];
        let i = 0;
        while (i < str.length) {
            // Find the nearest space within the length limit
            let end = Math.min(i + length, str.length);
            if (end < str.length) {
                while (end > i && str[end] !== ' ') {
                    end--;
                }
                // If no space was found, force break at length
                if (end === i) {
                    end = i + length;
                }
            }
            chunks.push(str.substring(i, end).trim());
            i = end + 1;
        }
        return chunks;
    }

    // Display combat round status to a player
    public displayCombatStatus(playerCharacterId: string): void {
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }

        const roundState = this.combatRoundManager.getCurrentState();
        const statusMessages: string[] = [];

        statusMessages.push("=== COMBAT STATUS ===");
        
        if (roundState.isActive) {
            statusMessages.push(`Round ${roundState.roundNumber} is active`);
            
            if (roundState.windowOpen) {
                const timeRemaining = this.combatRoundManager.getWindowTimeRemaining();
                statusMessages.push(`Action window is OPEN - ${Math.ceil(timeRemaining / 1000)} seconds remaining`);
                statusMessages.push("You can queue combat actions now using 'attack <target>' or 'kill <target>'");
            } else {
                statusMessages.push("Action window is CLOSED - waiting for next round");
            }
            
            statusMessages.push(`Actions queued this round: ${roundState.queuedActions.length}`);
        } else {
            statusMessages.push("Combat round system is not active");
        }

        this.sendCommandOutputToPlayer(playerCharacterId, statusMessages);
    }

}
