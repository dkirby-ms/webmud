import express, { Express, Request, Response } from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import { logger, validateJwt } from './util.js'
import { MongoClient } from 'mongodb';
import session from "express-session";
import MongoStore from 'connect-mongo'
import { format, transports } from "winston";
import { initEventHandlers } from './socketEventHandlers.js';
import { Repositories, createRepositories } from './db/index.js';
import { createDbClient } from './db/client.js';
import { World } from './world/world.js';


const WORLD_NAME = process.env.WORLD_NAME || 'defaultServerName';
const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost';
const SERVICE_PORT = process.env.SERVICE_PORT || 28999;
const _30_DAYS = 30 * 24 * 60 * 60 * 1000;
const CLEANUP_DISCONNECT_GRACE_PERIOD = 10_000; // 60 seconds
const CLEANUP_ZOMBIE_USERS_INTERVAL_IN_MS = 60_000; // 60 seconds
const MONGODB_ADDRESS = process.env.MONGO_ADDRESS || "mongodb://localhost:27017/?replicaSet=rs0";
const MONGODB_NAME = process.env.MONGODB_NAME = "game-service";
const MONGO_SOCKET_ADAPTER_COLLECTION = process.env.MONGO_SOCKET_ADAPTER_COLLECTION || "socket.io-adapter";
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
    store: MongoStore.create({ mongoUrl: MONGODB_ADDRESS, dbName: MONGODB_NAME }),
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
        this.httpServer.on("request", this.app);
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
        const { client: mongoClient, db: db } = await createDbClient(MONGODB_ADDRESS);
        this.db = db;
        this.repositories = createRepositories(db);

        // setup middlewares
        this.app.use(cors(this.corsOptions));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(sessionMiddleware);
        this.io.engine.use(sessionMiddleware);
        logger.debug("Express app and socket.io server configured with middlewares to support sessions, cors, json, and urlencoded.");

        // setup auth
        this.io.use(async (socket, next) => {
            const token = socket.handshake.auth.token;
            const session = (socket.request as any).session;
            if (!token) {
                return next(new Error("Authentication error - access token not found"));
            }
            try {
                const payload = await validateJwt(token);
                session.userId = payload.sub;
                //socket.userId = payload.sub;
                session.userFriendlyName = payload.name
                next();
            } catch (e) {
                return next(new Error("Authentication error - invalid access token"));
            }
        });

        // setup event handlers
        initEventHandlers({ io: this.io, repositories: this.repositories, logger: this.logger });
        
        // setup zombie user cleanup
    }

    public async start(): Promise<GameServiceStartReturn> {
        logger.info("Starting server instance" + WORLD_NAME);
        logger.debug("Loading game world data");
        
        // load the world data from the database
        const world_data = await this.repositories.worldRepository.getWorld(WORLD_NAME);
        if (world_data === null) {
            logger.error(`Failed to load world data for ${WORLD_NAME}`);
            throw new Error(`Failed to load world data for ${WORLD_NAME}`);
        }
        logger.debug("Game world data loaded successfully.");

        // initialize the game world object
        try {
            this.world = new World(world_data, this.repositories);
        } catch (e: any) {
            logger.error(`Failed to initialize game world: ${e.message}`);
            throw new Error(`Failed to initialize game world: ${e.message}`);
        }

        // Start the http server
        this.httpServer.listen(SERVICE_PORT, () => {
            this.logger.info(`server listening at ${SERVICE_URL}:${SERVICE_PORT}.`);
        });
        
        // Start the game world
        logger.debug("Starting server instance with world data: " + WORLD_NAME);
        this.world.start();
        logger.debug(`Server instance started with world data: ${WORLD_NAME}`);

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

