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
    router.get('/sockets', (req, res) => {
        const sockets = Array.from(io.of("/").sockets.values()).map(socket => ({
            id: socket.id,
            session: (socket.request as any).session,
            handshake: socket.handshake,
        }));
        res.json(sockets);
    });

    return router;
}
