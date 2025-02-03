import express from 'express';
import http from 'http';
import cors from "cors";
import { Server } from 'socket.io';
import { logger } from './util.js';
import bodyParser from "body-parser";
import { createAdapter } from "@socket.io/mongo-adapter";
import { MongoClient } from "mongodb";
import { DB } from "./db.js";

const SERVER_NAME = process.env.SERVER_NAME || 'Default Game Server';
const CLEANUP_ZOMBIE_USERS_INTERVAL_IN_MS = 60_000; // 60 seconds
const MONGODB_ADDRESS = process.env.MONGO_ADDRESS || "mongodb://localhost:27017/?replicaSet=rs0";
const MONGODB_NAME = "game-service";
const COLLECTION = "socket.io-adapter";
let gameState = {
    serverName: SERVER_NAME,
    players: {},
    npcs: {},
    objects: {},
    worldDetails: {}
};

const players = {};
const mongoClient = new MongoClient(MONGODB_ADDRESS);
await mongoClient.connect();
logger.info("Connected to MongoDB");
try {
   await mongoClient.db.createCollection(COLLECTION, {
     capped: true,
     size: 1e6
  });
} catch (e) {
  // collection already exists
}
const mongoCollection = mongoClient.db(DB).collection(COLLECTION);
const db = new DB(mongoClient.db(MONGODB_NAME));

export async function createApp(httpServer, config) {
    logger.info("Initializing game server " + SERVER_NAME);
    
    const app = createExpressApp();
    httpServer.on("request", app);
  
    app.use(cors(config.cors));

    const io = new Server(httpServer, {
      cors: config.cors,
      adapter: createAdapter(mongoCollection),
    });
  
    //initAuth({ app, io, db, config });
    //initEventHandlers({ io, db, config });
    setInterval(() => {
      io.emit('broadcast', { message: 'This is a periodic broadcast message' });
      logger.info("Periodic broadcast message sent");
    }, 500);
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

  app.use(bodyParser.json());

  return app;
}
export { logger }

function initEventHandlers({ io, db, config }) {
  io.use(async (socket, next) => {
    socket.userId = socket.request.user.id;

    let channels;

    try {
      channels = await db.fetchUserChannels(socket.userId);
    } catch (e) {
      return next(new Error("something went wrong"));
    }

    channels.forEach((channelId) => {
      socket.join(channelRoom(channelId));
    });

    socket.join(userRoom(socket.userId));
    socket.join(sessionRoom(socket.request.session.id));

    next();
  });

  io.on("connection", async (socket) => {
    socket.on("channel:create", createChannel({ io, socket, db }));
    socket.on("channel:join", joinChannel({ io, socket, db }));
    socket.on("channel:list", listChannels({ io, socket, db }));
    socket.on("channel:search", searchChannels({ io, socket, db }));

    socket.on("user:get", getUser({ io, socket, db }));
    socket.on("user:reach", reachUser({ io, socket, db }));
    socket.on("user:search", searchUsers({ io, socket, db }));

    socket.on("message:send", sendMessage({ io, socket, db }));
    socket.on("message:list", listMessages({ io, socket, db }));
    socket.on("message:ack", ackMessage({ io, socket, db }));
    socket.on("message:typing", typingMessage({ io, socket, db }));

    socket.on("disconnect", async () => {
      // the other users are not notified of the disconnection right away
      setTimeout(async () => {
        const sockets = await io.in(userRoom(socket.userId)).fetchSockets();
        const hasReconnected = sockets.length > 0;

        if (!hasReconnected) {
          await db.setUserIsDisconnected(socket.userId);

          io.to(userStateRoom(socket.userId)).emit(
            "user:disconnected",
            socket.userId,
          );
        }
      }, config.disconnectionGraceDelay ?? 10_000);

      const channels = await db.fetchUserChannels(socket.userId);

      channels.forEach((channelId) => {
        io.to(channelRoom(channelId)).emit("message:typing", {
          channelId,
          userId: socket.userId,
          isTyping: false,
        });
      });
    });

    const wasOnline = await db.setUserIsConnected(socket.userId);

    if (!wasOnline) {
      socket
        .to(userStateRoom(socket.userId))
        .emit("user:connected", socket.userId);
    }
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