import express, { Express } from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import cors from 'cors';
import { logger, validateJwt } from './util.js'
import session from "express-session";
import MongoStore from 'connect-mongo'
import { format, transports } from "winston";
import { Repositories, createRepositories } from './db/index.js';
import { createDbClient } from './db/client.js';
import { World } from './world/world.js';
import { createAdminRouter } from './admin.js';
import { registerSocketConnectionHandlers } from './socketHandlers.js';

const WORLD_NAME = process.env.WORLD_NAME || 'defaultServerName';
const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost';
const SERVICE_PORT = process.env.SERVICE_PORT || 28999;
const _30_DAYS = 30 * 24 * 60 * 60 * 1000;
const CLEANUP_DISCONNECT_GRACE_PERIOD = 30_000; // 30 seconds
const CLEANUP_ZOMBIE_USERS_INTERVAL_IN_MS = 60_000; // 60 seconds
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/?replicaSet=rs0";
const MONGODB_NAME = process.env.MONGODB_NAME = "game-service";
const SESSION_SECRET = process.env.SESSION_SECRET || "lolsecret42134213d2dcczq1";

const sessionMiddleware = session({
    name: "sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: _30_DAYS,
        sameSite: "lax",
    },
    store: MongoStore.create({ mongoUrl: MONGODB_URI, dbName: MONGODB_NAME }),
});

interface GameServiceStartReturn {
    close: () => Promise<void>;
}

export default class GameService {
    // public members
    protected app: Express;
    protected httpServer: any;
    protected io: Server;
    protected db: any;
    protected logger = logger;
    protected repositories: Repositories = {} as Repositories;
    protected world!: World;
    // private members
    private corsOptions = {
        origin: process.env.CORS_ORIGIN || "*",
        methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(",") : ["GET", "POST"]
    };
    private disconnectedPlayers: Map<string, { cleanupTimer: NodeJS.Timeout, disconnectTime: number }> = new Map();

    constructor(name: string) {
        // initialize logger
        logger.add(
            new transports.Console({
                format: format.combine(format.timestamp(), format.splat(), format.json()),
                level: process.env.LOG_LEVEL || 'info'
            }),
        );

        // create express app
        this.app = express();

        // create http server
        this.httpServer = createServer(this.app);
        //this.httpServer.on("request", this.app);
        logger.debug("Express app and http server created.");

        // create socket.io server
        this.io = new Server(this.httpServer, {
            cors: this.corsOptions,
            //adapter: createAdapter(mongoCollection),
        });
        logger.debug("Socket.io server created.");
        logger.info("Game service created.");

    }

    public async init(): Promise<void> {
        // initialize database
        logger.debug(`Initializing mongodb client connection to ${MONGODB_URI}.`);
        const { client: mongoClient, db: db } = await createDbClient(MONGODB_URI);
        this.db = db;
        this.repositories = createRepositories(db);

        // setup middlewares
        this.app.use(cors(this.corsOptions));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(sessionMiddleware);
        this.io.engine.use(sessionMiddleware);

        logger.debug("Express app and socket.io server configured with middlewares to support sessions, cors, json, and urlencoded.");

        // Setup admin router for debugging
        this.app.use('/admin', createAdminRouter(this.io));

        // setup auth and access token validator
        this.io.use(async (socket, next) => {
            const userId = socket.handshake.auth.userId;
            const userFriendlyName = socket.handshake.auth.userFriendlyName;
            const playerCharacterId = socket.handshake.auth.playerCharacterId;
            // const token = socket.handshake.auth.token;
            const session = (socket.request as any).session;
            session.userId = userId;
            session.userFriendlyName = userFriendlyName;
            session.playerCharacterId = playerCharacterId;
            next();
            // if (!token) {
            //     // Inform the client that no token was provided
            //     const error = new Error("Authentication error - access token not found");
            //     (error as any).code = "NO_TOKEN";
            //     return next(error);
            // }
            // try {
            //     const payload = await validateJwt(token);
            //     session.userId = payload.sub;
            //     session.userFriendlyName = payload.name;
            //     next();
            // } catch (e) {
            //     // Instead of a generic error, add a custom error code
            //     const error = new Error("Authentication error - token expired or invalid");
            //     (error as any).code = "TOKEN_EXPIRED";
            //     return next(error);
            // }
        });

        // setup connection handler
        this.io.on("connection", (socket) => {
            const session = (socket.request as any).session;
            const userId = session?.userId;

            socket.data.userId = userId;
            socket.data.playerCharacterId = session.playerCharacterId;

            if (userId) {
                if (this.disconnectedPlayers.has(userId)) {
                    clearTimeout(this.disconnectedPlayers.get(userId)!.cleanupTimer);
                    this.disconnectedPlayers.delete(userId);
                    this.logger.info(`Player ${userId} reconnected. Restoring state.`);
                    // Optionally, re-add the player to the game world here
                    //this.world.loop.reconnectPlayer(userId, socket.data.playerCharacterId, socket);
                }
                //this.world.loop.addPlayer(userId, socket.data.playerCharacterId, socket);
                // Delegate socket event registration to the dedicated module
                registerSocketConnectionHandlers(socket, {
                    io: this.io,
                    logger: this.logger,
                    repositories: this.repositories,
                    world: this.world,
                    disconnectedPlayers: this.disconnectedPlayers,
                    CLEANUP_DISCONNECT_GRACE_PERIOD: CLEANUP_DISCONNECT_GRACE_PERIOD,
                });
            }



            // ...existing code for other event handlers...
        });


        // Setup periodic zombie user cleanup
        setInterval(() => {
            const now = Date.now();
            this.disconnectedPlayers.forEach((record, userId) => {
                const elapsed = now - record.disconnectTime;
                if (elapsed >= CLEANUP_DISCONNECT_GRACE_PERIOD) {
                    this.logger.info(`Zombie Cleanup: Forcing removal of player ${userId} as cleanup timer did not fire.`);
                    // Optionally: remove the player from the game world here
                    clearTimeout(record.cleanupTimer);
                    this.disconnectedPlayers.delete(userId);
                }
            });
        }, CLEANUP_ZOMBIE_USERS_INTERVAL_IN_MS);
    }

    public async start(): Promise<GameServiceStartReturn> {
        logger.debug("Starting server instance " + WORLD_NAME);
        logger.debug("Loading game world metadata");

        // load the world data from the database
        const world_data = await this.repositories.worldRepository.getWorld(WORLD_NAME);
        if (world_data === null) {
            logger.error(`Failed to load world metadata for ${WORLD_NAME}`);
            throw new Error(`Failed to load world metadata for ${WORLD_NAME}`);
        }
        logger.debug("Game world metadata loaded successfully.");

        // initialize the game world object
        try {
            this.world = new World(world_data, this.repositories, this.io);
            await this.world.init();
        } catch (e: any) {
            logger.error(`Failed to initialize game world: ${e.message}`);
            throw new Error(`Failed to initialize game world: ${e.message}`);
        }

        // Start the game world
        logger.debug("Starting server instance with world data: " + WORLD_NAME);
        try {
            this.world.start();
        } catch (e: any) {
            logger.error(`Failed to start game world: ${e.message}`);
        }
        logger.info(`Server instance started with world data: ${WORLD_NAME}`);

        // Start the http server
        this.httpServer.listen(SERVICE_PORT, () => {
            this.logger.info(`server listening at ${SERVICE_URL}:${SERVICE_PORT}.`);
        });


        // return a callback for graceful shutdown
        return { close: this.close.bind(this) };
    }

    public async close(): Promise<void> {
        this.io.close();
        await new Promise<void>((resolve, reject) => {
            this.httpServer.close((err: Error) => err ? reject(err) : resolve());
        });
        if (this.db && typeof this.db.close === 'function') {
            await this.db.close();
        }
    }

}

