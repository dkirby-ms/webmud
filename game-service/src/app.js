import express from 'express';
import http from 'http';
import cors from "cors";
import { Server } from 'socket.io';
import { logger } from './util.js';
import bodyParser from "body-parser";
import { createAdapter } from "@socket.io/mongo-adapter";
import { MongoClient } from "mongodb";
import { DB, setupMongoDB } from "./db.js";
import { ExpressAuth } from "@auth/express"
import { initAuth } from "./auth/index.js";

const SERVER_NAME = process.env.SERVER_NAME || 'Default Game Server';
const CLEANUP_ZOMBIE_USERS_INTERVAL_IN_MS = 60_000; // 60 seconds
const MONGODB_ADDRESS = process.env.MONGO_ADDRESS || "mongodb://localhost:27017/?replicaSet=rs0";
const MONGODB_NAME = process.env.MONGODB_NAME = "game-service";
const MONGO_SOCKET_ADAPTER_COLLECTION = process.env.MONGO_SOCKET_ADAPTER_COLLECTION || "socket.io-adapter";
const mongoClient = new MongoClient(MONGODB_ADDRESS);

logger.level = process.env.LOG_LEVEL || 'debug'; // options: error, warn, info, http, verbose, debug, silly

const db = await setupMongoDB(mongoClient, logger);
const mongoCollection = mongoClient.db(MONGODB_NAME).collection(MONGO_SOCKET_ADAPTER_COLLECTION);

logger.debug("Created mongoDB client and database")
export async function createApp(httpServer, config) {
    logger.info("Initializing game server " + SERVER_NAME);
    
    logger.debug("Creating express app");
    const app = createExpressApp();
    httpServer.on("request", app);
    logger.debug("Express app created and configured with middleware");

    logger.debug("Creating socketio server");
    const io = new Server(httpServer, {
      cors: config.cors,
      adapter: createAdapter(mongoCollection),
    });
    logger.debug("Socket.io server created and configured with MongoDB adapter");
  
    logger.debug("Initializing auth and session management");
    initAuth({ app, io, db, config });

    initEventHandlers({ io, db, config });
    setInterval(() => {
      io.emit('broadcast', { message: 'This is a periodic broadcast message' });
      const connectedClients = io.sockets.sockets.size;
      logger.info(`Number of connected clients: ${connectedClients}`);
      logger.info("Periodic broadcast message sent");
    }, 30000);
    const timerId = scheduleZombieUsersCleanup({ io, db });
  
    return {
      logger,
      async close() {
        io.close();
        await io.of("/").adapter.close();
        clearInterval(timerId);
      },
    };
  }

function createExpressApp() {
  const app = express();

  app.set("etag", false);
  app.set("x-powered-by", false);

  // setup middleware
  logger.debug("Setting up auth middleware and AADB2C provider");
  app.set("trust proxy", true)
  app.use("/auth/*", ExpressAuth({ providers: [] }))
  logger.debug("Setting up CORS middleware");
  app.use(cors());
  logger.debug("Setting up bodyParser middleware");
  app.use(bodyParser.json());

  return app;
}
export { logger }

function initEventHandlers({ io, db, config }) {
  io.use(async (socket, next) => {
    logger.debug("Socket.io connection established");
    // socket.userId = socket.request.user.id;

    // let channels;

    // try {
    //   channels = await db.fetchUserChannels(socket.userId);
    // } catch (e) {
    //   return next(new Error("something went wrong"));
    // }

    // channels.forEach((channelId) => {
    //   socket.join(channelRoom(channelId));
    // });

    // socket.join(userRoom(socket.userId));
    // socket.join(sessionRoom(socket.request.session.id));

    // next();
  });

  io.on("connection", async (socket) => {
    // socket.on("connect", async () => {
    //   logger.info("Client connected");
    //   socket.emit("Client connected");
    // });

    socket.on("message", async () => {
      logger.info("Message received");
      socket.emit("message", "Message received");
    });
    // socket.on("channel:create", createChannel({ io, socket, db }));
    // socket.on("channel:join", joinChannel({ io, socket, db }));
    // socket.on("channel:list", listChannels({ io, socket, db }));
    // socket.on("channel:search", searchChannels({ io, socket, db }));

    // socket.on("user:get", getUser({ io, socket, db }));
    // socket.on("user:reach", reachUser({ io, socket, db }));
    // socket.on("user:search", searchUsers({ io, socket, db }));

    // socket.on("message:send", sendMessage({ io, socket, db }));
    // socket.on("message:list", listMessages({ io, socket, db }));
    // socket.on("message:ack", ackMessage({ io, socket, db }));
    // socket.on("message:typing", typingMessage({ io, socket, db }));

    socket.on("disconnect", async () => {
      // the other users are not notified of the disconnection right away
      // setTimeout(async () => {
      //   const sockets = await io.in(userRoom(socket.userId)).fetchSockets();
      //   const hasReconnected = sockets.length > 0;

      //   if (!hasReconnected) {
      //     await db.setUserIsDisconnected(socket.userId);

      //     io.to(userStateRoom(socket.userId)).emit(
      //       "user:disconnected",
      //       socket.userId,
      //     );
      //   }
      // }, config.disconnectionGraceDelay ?? 10_000);

      //const channels = await db.fetchUserChannels(socket.userId);

      // channels.forEach((channelId) => {
      //   io.to(channelRoom(channelId)).emit("message:typing", {
      //     channelId,
      //     userId: socket.userId,
      //     isTyping: false,
      //   });
      // });
    });

    // const wasOnline = await db.setUserIsConnected(socket.userId);

    // if (!wasOnline) {
    //   socket
    //     .to(userStateRoom(socket.userId))
    //     .emit("user:connected", socket.userId);
    // }
  });
}

function scheduleZombieUsersCleanup({ io, db }) {
  // if the logic of the "disconnect" event was not executed (for example, if the server was abruptly stopped), then
  // in some rare cases a user might be considered as online without being actually connected
  async function cleanupZombieUsers() {
    const userIds = await db.cleanupZombieUsers();

    if (userIds.length) {
      userIds.forEach((userId) => {
        io.to(userStateRoom(userId)).emit("user:disconnected", userId);
      });
    }
  }

  cleanupZombieUsers();
  return setInterval(cleanupZombieUsers, CLEANUP_ZOMBIE_USERS_INTERVAL_IN_MS);
}