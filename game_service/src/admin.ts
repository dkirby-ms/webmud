import express from 'express';
import { Server } from 'socket.io';

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
