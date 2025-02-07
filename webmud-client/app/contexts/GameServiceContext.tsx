"use client"
import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface GameServiceContextProps {
    socket: Socket | null;
    serverAddress: string;
    connectionStatus: string;
    connect: (server: string) => void;
    disconnect: () => void;
}

const GameServiceContext = createContext<GameServiceContextProps>({
    socket: null,
    serverAddress: '',
    connectionStatus: 'disconnected',
    connect: () => {},
    disconnect: () => {},
});

export const GameServiceProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [serverAddress, setServerAddress] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
    const { data: session, status } = useSession();
    
    // create a socket and connect to the specified game service uri 
    const connect = (server: string) => {
        const newSocket = io(server, {
            auth: {
                token: session?.accessToken
            },
        }); 
        newSocket.on('connect', () => {
            console.log('GameService provider connected to server:', server);
            setSocket(newSocket); // store the socket in the context state
            setServerAddress(server);
            setConnectionStatus('connected');
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
        <GameServiceContext.Provider value={{ socket, serverAddress, connectionStatus, connect, disconnect }}>
            {children}
        </GameServiceContext.Provider>
    );
}

export const useGameService = () => useContext(GameServiceContext);
