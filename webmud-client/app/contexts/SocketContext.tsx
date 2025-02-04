"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextProps {
  socket: Socket | null;
  connect: (server: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  connect: () => {},
  disconnect: () => {},
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = (server: string) => {
    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
      console.log('Socket provider disconnected from existing socket');
    }
    const newSocket = io(server, { transports: ["websocket"] });
    setSocket(newSocket);
    console.log('Socket provider created socket context and connected to server:', server);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    console.log('Socket provider disconnected from socket server');
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);