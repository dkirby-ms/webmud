import winston from "winston";
import type { Server as SocketIOServer } from "socket.io";
import { Repositories } from "./db/index.js";

const CLEANUP_DISCONNECT_GRACE_PERIOD = process.env.CLEANUP_DISCONNECT_GRACE_PERIOD || 10_000; // 10 seconds

export function initConnectionHandler({ io, repositories, logger }: { io: SocketIOServer, repositories: Repositories, logger: winston.Logger }) {
  io.on("connection", async (socket) => {
    // register user as connected in mongodb and the session
    const session = (socket.request as any).session;

    logger.info(`Client ${session.userFriendlyName} with userid ${session.userId} connected on socket ${socket.id} from ${socket.handshake.address}`);
    
    
  });
}