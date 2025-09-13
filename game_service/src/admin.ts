import express from 'express';
import { Server } from 'socket.io';

// Future work - add authorization check for admin routes
// Future work - add more admin routes for debugging
// Future work - add more admin routes for monitoring
// Future work - add more admin routes for managing game state
// Future work - add more admin routes for managing game world
// Future work - add more admin routes for managing game entities
export function createAdminRouter(io: Server) {
    const router = express.Router();

    // Endpoint to inspect connected sockets
    router.get('/sockets', async (_req, res) => {
        const sockets = await io.fetchSockets();

        res.json(sockets.map((socket) => ({
            id: socket.id,
            userId: socket.data.userId,
            playerCharacterId: socket.data.playerCharacterId,
            timeConnected: socket.data.timeConnected,
            auth: socket.handshake.auth,
        })));

    });

    return router;
}
