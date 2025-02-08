import express from 'express';
import MongoStore from 'connect-mongo'
import cors from "cors";
import { Server } from 'socket.io';
import { logger } from './util.js';
import bodyParser from "body-parser";
import { createAdapter } from "@socket.io/mongo-adapter";
import { MongoClient } from "mongodb";
import { setupMongoDB } from "./db.js";
import { ExpressAuth } from "@auth/express"
import { initAuth } from "./auth/index.js";
import session from "express-session";
import { getUser } from "./user/get.js";
import { reachUser } from "./user/reach.js";
import { searchUsers } from "./user/search.js";
import { sendMessage } from "./message/send.js";
import { listMessages } from "./message/list.js";
import { ackMessage } from "./message/ack.js";
import { typingMessage } from "./message/typing.js";
import { createChannel } from "./channel/create.js";
import { joinChannel } from "./channel/join.js";
import { listChannels } from "./channel/list.js";
import { searchChannels } from './channel/search.js';


const _30_DAYS = 30 * 24 * 60 * 60 * 1000;
const SERVER_NAME = process.env.SERVER_NAME || 'Default Game Server';
const CLEANUP_DISCONNECT_GRACE_PERIOD = 10_000; // 60 seconds
const CLEANUP_ZOMBIE_USERS_INTERVAL_IN_MS = 60_000; // 60 seconds
const MONGODB_ADDRESS = process.env.MONGO_ADDRESS || "mongodb://localhost:27017/?replicaSet=rs0";
const MONGODB_NAME = process.env.MONGODB_NAME = "game-service";
const MONGO_SOCKET_ADAPTER_COLLECTION = process.env.MONGO_SOCKET_ADAPTER_COLLECTION || "socket.io-adapter";
const SESSION_SECRET = process.env.SESSION_SECRET || "lolsecret42134213d2dcczq1";
const mongoClient = new MongoClient(MONGODB_ADDRESS);
const sessionMiddleware = session({
  name: "sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: _30_DAYS,
    sameSite: "lax",
  },
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/game-service' })
});
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
  
    logger.debug("Initializing auth");
    initAuth({ app, io, db, config });

    logger.debug("Initializing session middleware");
    app.use(sessionMiddleware);
    io.engine.use(sessionMiddleware);

    logger.debug("Initializing event handlers");
    initEventHandlers({ app, io, db, config });

    logger.debug("Scheduling zombie users cleanup");
    const timerId = scheduleZombieUsersCleanup({ io, db });
  
    return {
      logger,
      async close() { // close is used in entrypoint.js to close the socket server when the process receives a SIGTERM signal
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

function initEventHandlers({ app, io, db, config }) {
  io.on("connection", async (socket) => {
    // register user as connected in mongodb and the session
    const session = socket.request.session;
    logger.info(`Client ${session.userFriendlyName} with userid ${session.userId} connected on socket ${socket.id} from ${socket.handshake.address}`);
    
    // register user socket event handlers
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
      //the other users are not notified of the disconnection right away
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
      }, CLEANUP_DISCONNECT_GRACE_PERIOD); 

      //const channels = await db.fetchUserChannels(socket.userId);

      // channels.forEach((channelId) => {
      //   io.to(channelRoom(channelId)).emit("message:typing", {
      //     channelId,
      //     userId: socket.userId,
      //     isTyping: false,
      //   });
      // });
    });

    const wasOnline = await db.setUserIsConnected(session.userId);

    if (!wasOnline) {
        // join standard channels or stored user defined custom ones
        // .to(userStateRoom(socket.userId))
        // .emit("user:connected", socket.userId);
        logger.info(`User ${session.userId} is now connected`);
    } else {
      // may need to implement reconnect logic
      logger.debug(`User ${session.userId} was already connected`);
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
        //io.to(userStateRoom(userId)).emit("user:disconnected", userId);
        logger.debug(`${userId} is now considered as disconnected`);
      });
    }
  }

  cleanupZombieUsers();
  return setInterval(cleanupZombieUsers, CLEANUP_ZOMBIE_USERS_INTERVAL_IN_MS);
}