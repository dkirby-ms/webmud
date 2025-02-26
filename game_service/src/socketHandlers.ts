import { Socket, Server } from 'socket.io';
import { sentMessage } from "./message/send.js";
import { MessageTypes } from './taxonomy.js';

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
    const messageDb = repositories.messageRepository;

	socket.on(MessageTypes.game.PLAYER_JOIN, async (playerCharacterId: string) => {
		// ...existing code for connectPlayer...
		const playerCharacter = await repositories.playerCharacterRepository.getCharacterById(playerCharacterId);
		if (playerCharacter?.userId !== userId) {
			throw new Error("Player is not authorized to connect with this character.");
		}
		socket.data.timeConnected = Date.now();
		socket.data.playerCharacterId = playerCharacterId;
		socket.data.playerCharacterName = playerCharacter.name;
		logger.info(`Player ${userId} connected with character ${playerCharacter.name}`);
		world.addPlayer(userId, playerCharacter, socket);
	});
	
	socket.on('disconnect', () => {
		// ...existing code for disconnect...
		if (userId) {
			logger.info(`Player ${userId} disconnected. Initiating cleanup grace period.`);
			const disconnectTime = Date.now();
			const cleanupTimer = setTimeout(() => {
				logger.info(`Cleanup: Player ${userId} did not reconnect; removing from game world.`);
				world.removePlayer(userId);
				disconnectedPlayers.delete(userId);
			}, CLEANUP_DISCONNECT_GRACE_PERIOD);
			disconnectedPlayers.set(userId, { cleanupTimer, disconnectTime });
		}
	});

	// when a client sends a chat message -
	socket.on(MessageTypes.chat.SEND_MESSAGE, (message) => sentMessage(io, socket, message, "global"));

	
    //socket.on("message:send", sendMessage(io, socket, mesage);
    // socket.on("message:send", (message) => {
	// 	socket.emit(MessageTypes.chat.SENT_MESSAGE, message);
    // });
}
