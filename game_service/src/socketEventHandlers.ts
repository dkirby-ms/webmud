import winston from "winston";
import type { Server as SocketIOServer } from "socket.io";
import { createRepositories, Repositories } from "./db/index.js";
import { createChannel } from "./channel/create.js";
import { joinChannel } from "./channel/join.js";
import { listChannels } from "./channel/list.js";
import { searchChannels } from './channel/search.js';
import { getUser } from "./user/get.js";
import { reachUser } from "./user/reach.js";
import { searchUsers } from "./user/search.js";
import { ackMessage } from "./message/ack.js";

export function initEventHandlers({ io, repositories, logger }: { io: SocketIOServer, repositories: Repositories, logger: winston.Logger }) {
  // io.use(async (socket, next) => {
  //   let channels;
  //   const session = socket.request.session;
  //   try {
  //     channels = await db.fetchUserChannels(session.userId);
  //   } catch (error) {
  //     return next(new Error("Could not get user channels from database."));
  //   }
  // });
  io.on("connection", async (socket) => {
    // register user as connected in mongodb and the session
    const session = (socket.request as any).session;


    
    logger.info(`Client ${session.userFriendlyName} with userid ${session.userId} connected on socket ${socket.id} from ${socket.handshake.address}`);
    
    // register user socket event handlers
    socket.on("channel:create", createChannel({ io, session, socket, repositories }));
    socket.on("channel:join", joinChannel({ io, session, socket, repositories }));
    socket.on("channel:list", listChannels({ io, session, socket, repositories }));
    socket.on("channel:search", searchChannels({ io, session, socket, repositories }));
    
    socket.on("user:get", getUser({ socket, repositories }));
    socket.on("user:reach", reachUser({ io, session, socket, repositories }));
    socket.on("user:search", searchUsers({ io, session, socket, repositories }));
    
    // socket.on("message:send", sendMessage({ io, socket, repositories }));
    // socket.on("message:list", listMessages({ io, socket, repositories }));
    socket.on("message:ack", ackMessage({ socket, session, repositories }));
    // socket.on("message:typing", typingMessage({ io, socket, repositories }));

    // socket.on("disconnect", async () => {
    //   //the other users are not notified of the disconnection right away
    //   setTimeout(async () => {
    //     const sockets = await io.in(userRoom(socket.userId)).fetchSockets();
    //     const hasReconnected = sockets.length > 0;

    //     if (!hasReconnected) {
    //       await repositories.userRepository.setUserIsDisconnected(socket.userId);

    //       io.to(userStateRoom(socket.userId)).emit(
    //         "user:disconnected",
    //         socket.userId,
    //       );
    //     }
    //   }, CLEANUP_DISCONNECT_GRACE_PERIOD); 

    //   //const channels = await db.fetchUserChannels(socket.userId);

    //   // channels.forEach((channelId) => {
    //   //   io.to(channelRoom(channelId)).emit("message:typing", {
    //   //     channelId,
    //   //     userId: socket.userId,
    //   //     isTyping: false,
    //   //   });
    //   // });
    // });

    const wasOnline = await repositories.userRepository.setUserIsConnected(session.userId);

    if (!wasOnline) {
        // notify other users that this user is now connected
        // 
        logger.info(`User ${session.userId} is now connected`);
    } else {
      // may need to implement reconnect logic
      logger.debug(`User ${session.userId} was already connected`);
    }
  });
}