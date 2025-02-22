"use client"
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface GameServiceContextProps {
    socket: Socket | null;
    serverAddress: string;
    connectionStatus: string;
    connect: (server: string, playerCharacterId: string) => void;
    disconnect: () => void;
    registerHandler: (event: string, handler: (data: any) => void) => void;
    unregisterHandler: (event: string, handler: (data: any) => void) => void;
}

const GameServiceContext = createContext<GameServiceContextProps>({
    socket: null,
    serverAddress: '',
    connectionStatus: 'disconnected',
    connect: (server: string, playerCharacterId: string) => {},
    disconnect: () => {},
    registerHandler: () => {},
    unregisterHandler: () => {},
});

export const GameServiceProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [serverAddress, setServerAddress] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
    const { data: session, status } = useSession();
    
    // Create a registry for event handlers.
    const eventHandlers = useRef<Map<string, Set<(data: any) => void>>>(new Map());

    const registerHandler = (event: string, handler: (data: any) => void) => {
        if (!eventHandlers.current.has(event)) {
            eventHandlers.current.set(event, new Set());
        }
        eventHandlers.current.get(event)?.add(handler);
        // Automatically bind to socket if available.
        if (socket) {
            socket.on(event, handler);
        }
    };

    const unregisterHandler = (event: string, handler: (data: any) => void) => {
        eventHandlers.current.get(event)?.delete(handler);
        if (socket) {
            socket.off(event, handler);
        }
    };

    // create a socket and connect to the specified game service uri 
    const connect = (server: string, playerCharacterId: string) => {
        // indicate connection attempt
        setConnectionStatus('connecting');
        
        const newSocket = io(server, {
            auth: {
                token: session?.accessToken,
                playerCharacterId: playerCharacterId,
            },
        }); 
        newSocket.on('connect', () => {
            console.log('GameService provider connected to server:', server);
            setSocket(newSocket); // store the socket in the context state
            setServerAddress(server);
            setConnectionStatus('connected');
            // Bind all registered events to the new socket.
            eventHandlers.current.forEach((handlers, event) => {
                handlers.forEach(handler => newSocket.on(event, handler));
            });
        });
        newSocket.on('connect_error', (err: any) => {
            console.log('Connection error connecting to server:', server, err);
            setServerAddress(server);
            setConnectionStatus('error');
            alert(err);
        });
        newSocket.on('disconnect', () => {
            console.log('GameService provider disconnected from server:', server);
            setSocket(null);
            setServerAddress('');
            setConnectionStatus('disconnected');
        });
    }

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setServerAddress('');
            setConnectionStatus('disconnected');
        } else {
            console.log('GameService provider disconnect received but no socket connection to disconnect!');
        }
    }

    useEffect(() => {
        return () => {
            if (socket) { // clean up on unmount
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [socket]);

    return (
        <GameServiceContext.Provider value={{ socket, serverAddress, connectionStatus, connect, disconnect, registerHandler, unregisterHandler }}>
            {children}
        </GameServiceContext.Provider>
    );
}

export const useGameService = () => useContext(GameServiceContext);
