import { Socket, Server } from 'socket.io';
import { MessageTypes } from './taxonomy.js';
import { _ } from 'ajv';
import { CommandType, parseCommand } from './commandParser.js';

interface Dependencies {
    // socket server
    io: Server;
	// logger used for logging events
	logger: any;
	// repositories to access data (e.g. playerCharacterRepository)
	repositories: any;
	// game world instance used for add/remove player
	world: any;
	// disconnectedPlayers map to track disconnects
	disconnectedPlayers: Map<string, { cleanupTimer: NodeJS.Timeout, disconnectTime: number }>;
	// cleanup interval constant (in ms)
	CLEANUP_DISCONNECT_GRACE_PERIOD: number;
}

export function registerSocketConnectionHandlers(socket: Socket, deps: Dependencies) {
	const { logger, repositories, world, disconnectedPlayers, CLEANUP_DISCONNECT_GRACE_PERIOD } = deps;
	const userId = socket.data?.userId;
	const io = deps.io;

	// on connectPlayer
	socket.on(MessageTypes.game.PLAYER_JOIN, async (playerCharacterId: string) => {
		
		const playerCharacter = await repositories.playerCharacterRepository.getCharacterById(playerCharacterId);
		logger.info(`Auth debug - userId from socket: ${userId}, playerCharacter.userId: ${playerCharacter?.userId}, match: ${playerCharacter?.userId === userId}`);
		if (playerCharacter?.userId !== userId) {
			throw new Error("Player is not authorized to connect with this character.");
		}
		socket.data.timeConnected = Date.now();
		socket.data.playerCharacterId = playerCharacterId;
		socket.data.playerCharacterName = playerCharacter.name;
		// if the player was disconnected, remove from disconnectedPlayers map
		if (disconnectedPlayers.has(playerCharacterId))
		{
		 	const disconnectedPlayer = disconnectedPlayers.get(playerCharacterId);
		 	clearTimeout(disconnectedPlayer?.cleanupTimer);
			const disconnectTime = disconnectedPlayer?.disconnectTime || 0;
			world.reconnectPlayer(playerCharacterId, socket);
			disconnectedPlayers.delete(playerCharacterId);
			logger.info(`Player character ${playerCharacterId} reconnected after ${Date.now() - disconnectTime}ms.`);
		} else {
			logger.info(`Player ${userId} connected with character ${playerCharacter.name}`);
			world.addPlayer(playerCharacterId, playerCharacter, socket);
		}

		// // Send initial map data upon player join
        // if (playerEntity && playerEntity.state?.mapData) {
        //     const mapUpdateData = {
        //         rooms: playerEntity.state.mapData.rooms,
        //         playerLocation: playerEntity.state.location,
        //         visitedRooms: Array.from(playerEntity.state.visitedRooms || [])
        //     };
        //     socket.emit(MessageTypes.game.MAP_UPDATE, mapUpdateData);
        // }
	});
	
	socket.on('disconnect', () => {
		// ...existing code for disconnect...
		logger.info(`Player character ${socket.data.playerCharacterId} disconnected. Initiating cleanup grace period.`);
		const disconnectTime = Date.now();
		const cleanupTimer = setTimeout(() => {
			logger.info(`Cleanup: Player character ${socket.data.playerCharacterId} did not reconnect; removing from game world.`);
			world.removePlayer(socket.data.playerCharacterId, { disconnected: true});
			disconnectedPlayers.delete(socket.data.playerCharacterId);
		}, CLEANUP_DISCONNECT_GRACE_PERIOD);
		disconnectedPlayers.set(socket.data.playerCharacterId, { cleanupTimer, disconnectTime });
	});

	// when a client sends a command message -
	socket.on(MessageTypes.command.SEND_COMMAND, (command) => {
		// parse the command and take the appropriate action
		const parsedCommand = parseCommand(command);
		switch (parsedCommand.type) {
			case CommandType.MOVE:
				const direction = parsedCommand.args![0];
				world.movePlayer(socket.data.playerCharacterId, direction);
				break;
			case CommandType.SAY:
				// need to update this to only send to the room the player is in and add additional commands for comms
				//sentMessage(io, socket, parsedCommand.text!, "global");
				world.sayToRoom(socket.data.playerCharacterId, parsedCommand.text!);
				break;
			case CommandType.TELL:
				if (parsedCommand.args && parsedCommand.args.length > 0) {
					const toPlayerSocket = world.getPlayerSocketByName(parsedCommand.args[0]);
					const fromPlayerName = world.getPlayerName(socket.data.playerCharacterId);
					if (!toPlayerSocket) {
						const output = `Player ${parsedCommand.args[0]} is not online.`;
						const messages: string[] = [];
						messages[0] = output;
						world.sendCommandOutputToPlayer(socket.data.playerCharacterId, messages);
						return;
					}
					const messagesToPlayer: string[] = [];
					messagesToPlayer[0] = `You tell ${parsedCommand.args[0]} '${parsedCommand.text!}'`;
					world.sendCommandOutputToPlayer(socket.data.playerCharacterId, messagesToPlayer);
					const messagesToTarget: string[] = [];
					messagesToTarget[0] = `${fromPlayerName} tells you '${parsedCommand.text!}'`;
					world.sendCommandOutputToPlayer(toPlayerSocket.data.playerCharacterId, messagesToTarget);
				}
				break;
			case CommandType.LOOK:
				 // Add support for map-related look command
				world.playerLooksAt(socket.data.playerCharacterId, parsedCommand.args);
				break;
			case CommandType.COMBAT:
				// Handle combat/attack commands
				const target = parsedCommand.args && parsedCommand.args.length > 0 ? parsedCommand.args.join(" ") : undefined;
				if (target) {
					// Attack a target
					world.handleCombatCommand(socket.data.playerCharacterId, target);
				} else {
					// Display combat status if no target specified
					world.displayCombatStatus(socket.data.playerCharacterId);
				}
				break;
			case CommandType.FLEE:
				// Handle flee command
				world.handleFleeCommand(socket.data.playerCharacterId);
				break;
			case CommandType.EMOTE:
				// Handle emote commands
				if (parsedCommand.text) {
					const emoteAction = parsedCommand.text;
					const target = parsedCommand.args && parsedCommand.args.length > 0 ? parsedCommand.args[0] : undefined;
					world.emoteToRoom(socket.data.playerCharacterId, emoteAction, target);
				}
				break;
			case CommandType.HELP:
				// Handle help command
				world.displayHelp(socket.data.playerCharacterId, parsedCommand.args);
				break;
			case CommandType.DELETE_CHARACTER:
				// Handle delete character command
				{
					const output = "To delete your character, please use the web interface. This action cannot be undone.";
					const messages: string[] = [];
					messages[0] = output;
					world.sendCommandOutputToPlayer(socket.data.playerCharacterId, messages);
				}
				break;
			case CommandType.UNKNOWN:
				logger.warn(`Player ${socket.data.playerCharacterId} sent an unknown command: ${command}`);
				{
					const output = "Sorry, I don't understand that command.";
					const messages: string[] = [];
					messages[0] = output;
					world.sendCommandOutputToPlayer(socket.data.playerCharacterId, messages);
				}
				break;
		}
	});
}
