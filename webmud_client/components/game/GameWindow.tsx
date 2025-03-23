"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Flex, Box, Separator } from "@radix-ui/themes";
import { GameMessagePanel } from "./GameMessagePanel.tsx";
import { MapPanel } from "./MapPanel.tsx";
import { RoomView } from "./RoomView.tsx";
import { StatusPanel } from "./StatusPanel.tsx";
import { CommandLine } from "./CommandLine.tsx";
import { useGameService } from "../../contexts/GameServiceContext.tsx";

export function GameWindow() {
    const { data: session } = useSession();
    const [mapData, setMapData] = useState(null);
    const { gameState, socket } = useGameService();
    useEffect(() => {
        if (!socket) return;
        socket.on('game:map_update', (data) => {
          setMapData(data);
        });
        
        return () => {
          socket.off('game:map_update');
        };
      }, []);

    if (!session) return <div>Not authenticated</div>
    // Listen for map updates from the server
    const handleRoomClick = (roomId: string) => {
        console.log(`Room clicked: ${roomId}`);
        // You could implement actions like:
        // - Show room details
        // - Navigate to room if possible
        // - Mark room as target destination
      };

    return (
        <Flex direction="column" gap="0" height="100%" width="100%" >
            {/* Top section: Map, Room details, and Status */}
            <Flex direction="row">
                <Box width="75%" style={{ borderRight: "1px solid #ccc" }}>
                    <MapPanel />
                    <Separator style={{ width: "100%", margin: "10px 0" }} />
                    <RoomView />
                </Box>
                <Box width="25%">
                    <StatusPanel />
                </Box>
            </Flex>
            {/* Bottom section: Game Messages and Command Input */}
            <Flex direction="column" style={{ borderTop: "1px solid #ccc" }}>
                <GameMessagePanel />
                <CommandLine />
            </Flex>
        </Flex>
    )
};