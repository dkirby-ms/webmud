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
    globalChatMessages: string[];
    gameState: any;
}

const GameServiceContext = createContext<GameServiceContextProps>({
    socket: null,
    serverAddress: '',
    connectionStatus: 'disconnected',
    connect: (server: string, playerCharacterId: string) => {},
    disconnect: () => {},
    globalChatMessages: [],
    gameState: {},
});

export const GameServiceProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [serverAddress, setServerAddress] = useState<string>('');
    const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
    const [globalChatMessages, setGlobalChatMessages] = useState<string[]>([]);
    const [gameState, setGameState] = useState<any>({});
    const { data: session, status } = useSession();
    
    // create a socket and connect to the specified game service uri 
    const connect = (server: string, playerCharacterId: string) => {
        // indicate connection attempt
        setConnectionStatus('connecting');
        
        const newSocket = io(server, {
            auth: {
                userId: (session as any)?.userId,
                userFriendlyName: (session as any)?.user.name,
                playerCharacterId: playerCharacterId,
            },
        }); 
        newSocket.on('connect', () => {
            console.log('GameService provider connected to server:', server);
            setSocket(newSocket); // store the socket in the context state
            setServerAddress(server);
            setConnectionStatus('connected');

            newSocket.emit('game:player_join', playerCharacterId);
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

        newSocket.on("chat:sent", (message) => {
            const formattedMessage = `${message.senderName}: ${message.content}`;
            setGlobalChatMessages(prev => [...prev, formattedMessage]);
        });

        newSocket.on("chat:tell", (message) => {
            const formattedMessage = `${message.senderName} tells you: ${message.content}`;
            setGlobalChatMessages(prev => [...prev, formattedMessage]);
        });

        newSocket.on("game:state_update", (gameState) => {
            setGameState(gameState);
        });

        newSocket.on("game:room_update", (roomUpdate) => {
            // setGameState(prev => ({
            //     ...prev,
            //     roomState: {
            //         ...prev.roomState,
            //         ...roomUpdate
            //     }
            // }));
        });

        //newSocket.on("game:room_state", (roomState) => {
        // newSocket.on("game:room_state"), (roomId, entityStates) => {
        //     setGameState(prev => ({
        //         ...prev,
        //         roomState: roomState
        //     }));
        // });

        newSocket.on("game:messages", (messages) => {
            setGlobalChatMessages(prev => [...prev, ...messages]);
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
        <GameServiceContext.Provider value={{ socket, serverAddress, connectionStatus, connect, disconnect, globalChatMessages, gameState }}>
            {children}
        </GameServiceContext.Provider>
    );
}

export const useGameService = () => useContext(GameServiceContext);
