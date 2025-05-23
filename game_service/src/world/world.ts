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
                    // Handle other entity types if necessary
                    if (entity.id) {
                        this.entities.set(entity.id, entity);
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
    }

    
    // Add a player to the world as an entity
    public addPlayer(playerCharacterId: string, playerCharacter: any, socket: Socket): void {
        // Add the player to the world using Map.
        this.players.set(playerCharacterId, { playerCharacter, socket });

        // Create a player entity using the factory
        const playerEntity = EntityFactory.createPlayerEntity(playerCharacter);

        // Set initial state values if not already set by the factory
        // Default values for new players
        if (!playerEntity.state.currentRoom) playerEntity.state.currentRoom = "";
        if (!playerEntity.state.roomDescription) playerEntity.state.roomDescription = "";
        if (!playerEntity.state.currentHealth) playerEntity.state.currentHealth = 100;
        if (!playerEntity.state.gameMessages) playerEntity.state.gameMessages = [];
        if (!playerEntity.state.currentLocation) playerEntity.state.currentLocation = "room-001";
        if (!playerEntity.state.roomExits) playerEntity.state.roomExits = [];
        if (!playerEntity.state.roomItems) playerEntity.state.roomItems = [];
        if (!playerEntity.state.roomEntityStates) playerEntity.state.roomEntityStates = [];

        // Add welcome message
        playerEntity.state.gameMessages.push("You have joined the world of " + this.name);

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
                    entity.state.visitedRooms = new Set<string>();
                }

                // Mark both current and destination rooms as visited
                entity.state.visitedRooms.add(entity.state.currentLocation);
                entity.state.visitedRooms.add(locationExit.room_id);

                // Initialize map data if not already set
                if (!entity.state.mapData) {
                    entity.state.mapData = { rooms: {} };
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
                    roomEntityViews: this.getRoomEntityViews(locationExit.room_id, playerCharacterId)
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
                    const otherEntity = this.entities.get(entityPkid) as PlayerEntity;
                    if (otherEntity && otherEntity.state?.gameMessages) {
                        otherEntity.state.gameMessages.push(`${entity.baseData.name} ${movementType}s ${direction}.`);
                    }
                }

                // push a message to players in the new room indicating the player arrived
                for (const entityPkid of newRoom.roomEntities) {
                    if (entityPkid !== playerCharacterId) { // Don't notify the arriving player
                        const otherEntity = this.entities.get(entityPkid) as PlayerEntity;
                        if (otherEntity && otherEntity.state?.gameMessages) {
                            otherEntity.state.gameMessages.push(`${entity.baseData.name} ${movementType}s in from ${getOppositeDirection(direction)}.`);
                        }
                    }
                }

                // Send map update to player
                this.sendMapUpdateToPlayer(playerCharacterId);

                // Send room state to player
                this.sendStateToPlayer(playerCharacterId, locationExit.room_id);
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
        entity.state.mapData.rooms[roomId] = {
            id: roomId,
            name: room.dbRecord.name,
            exits: roomExits
        };
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
            entity.state.gameMessages.push(...messages);
        }
    }

    // get all entities in a room
    private getRoomEntities(roomId: string): Entity[] {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            throw new Error(`Room not found for location ${roomId}`);
        }
        return Array.from(this.entities.values()).filter(e => room.roomEntities.includes(e.pkid));
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
                entity.state.visitedRooms = new Set<string>();
            }
            if (!entity.state.mapData) {
                entity.state.mapData = { rooms: {} };
            }

            // Mark room as visited
            entity.state.visitedRooms.add(location);

            // Add room to map data
            this.updateRoomInPlayerMap(entity, room);

            // Use updateState method for entity state changes
            entity.updateState({
                currentLocation: location,
                currentRoom: room.dbRecord.name,
                roomDescription: room.dbRecord.description,
                roomExits: room.dbRecord.exits,
                roomEntityViews: this.getRoomEntityViews(location, playerCharacterId)
            });

            if (entity.state?.gameMessages) {
                entity.state.gameMessages.push(`You have arrived in a ${room.dbRecord.name}.`);
            }
            
            // Notify other entities in the room about the new arrival
            const roomEntities = this.getRoomEntities(location);
            for (const roomEntity of roomEntities) {
                if (roomEntity.pkid !== playerCharacterId && roomEntity.state?.gameMessages) {
                    roomEntity.state.gameMessages.push(`${entity.baseData.name} has arrived, seemingly from nowhere.`);
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
                entity.state.gameMessages.push(`You say, "${message}"`);
            }
            // Add the message to the other entities' game messages
            for (const roomEntity of roomEntities) {
                if (roomEntity.pkid !== playerCharacterId && roomEntity.state?.gameMessages) {
                    roomEntity.state.gameMessages.push(`${entity.baseData.name} says, "${message}"`);
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
                entity.state.gameMessages.push(`You are now ${newMovementType}ing.`);
            }
        } else {
            if (entity.state?.gameMessages) {
                entity.state.gameMessages.push(`You can't ${newMovementType}.`);
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
                        targetPlayer.state.gameMessages.push(targetMessage);
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
            entity.state.gameMessages.push(playerMessage);
        }
        
        // Add the message to other entities in the room
        for (const roomEntity of roomEntities) {
            // Skip the originating player and the target (who gets a special message)
            if (roomEntity.pkid !== playerCharacterId && 
                (!target || roomEntity.baseData.name.toLowerCase() !== target.toLowerCase()) && 
                roomEntity.state?.gameMessages) {
                roomEntity.state.gameMessages.push(othersMessage);
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
        helpMessages.push("  attack (a), kill (k) <target> - Attack someone or something");
        
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
                helpMessages.push("Attack another character or creature.");
                helpMessages.push("Usage: attack <target> or kill <target>");
                helpMessages.push("Example: 'attack goblin' or 'kill orc'");
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
                    targetEntity.state.gameMessages.push(`${entity.baseData.name} looks at you.`);
                }
                
                if (entity.state?.gameMessages) {
                    entity.state.gameMessages.push(`You look at ${targetEntity.baseData.name}.`);
                }
            } else {
                if (entity.state?.gameMessages) {
                    entity.state.gameMessages.push(`You don't see ${args.join(" ")} here.`);
                }
            }
        } else {
            // Look at the room
            if (entity.state?.gameMessages) {
                entity.state.gameMessages.push(`You look around the ${room.dbRecord.name}.`);
                entity.state.gameMessages.push(room.dbRecord.description);
                if (room.dbRecord.exits) {
                    entity.state.gameMessages.push("Exits: " + Object.keys(room.dbRecord.exits).join(", "));
                }
                if (room.roomEntities.length > 0) {
                    const entityNames = room.roomEntities
                        .filter(id => id !== playerCharacterId) // Exclude the looking player
                        .map(id => {
                            const entity = this.entities.get(id);
                            return entity ? entity.baseData.name : id;
                        });
                    
                    if (entityNames.length > 0) {
                        entity.state.gameMessages.push("You see: " + entityNames.join(", "));
                    } else {
                        entity.state.gameMessages.push("You don't see anyone else here.");
                    }
                }
            }
        }
    }


    // Handle attack and kill commands with a peaceful message
    public handleCombatCommand(playerCharacterId: string, target?: string): void {
        const entity = this.entities.get(playerCharacterId) as PlayerEntity;
        if (!entity) {
            throw new Error(`Player entity not found for user ID ${playerCharacterId}`);
        }
        
        if (entity.state?.gameMessages) {
            entity.state.gameMessages.push("You feel too peaceful for combat.");
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

}
