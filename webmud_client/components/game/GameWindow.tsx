"use client";
import { useSession } from "next-auth/react";
import { Flex, Box, Separator } from "@radix-ui/themes";
import { GameMessagePanel } from "./GameMessagePanel.tsx";
import { MapPanel } from "./MapPanel.tsx";
import { RoomView } from "./RoomView.tsx";
import { CommandLine } from "./CommandLine.tsx";

export function GameWindow() {
    const { data: session } = useSession();

    if (!session) return <div>Not authenticated</div>
    // Listen for map updates from the server
    // const handleRoomClick = (roomId: string) => {
    //     console.log(`Room clicked: ${roomId}`);
    //     // You could implement actions like:
    //     // - Show room details
    //     // - Navigate to room if possible
    //     // - Mark room as target destination
    //   };

    return (
        <Flex direction="column" gap="0" height="100%" width="100%" >
            {/* Top section: Map and Room details */}
            <Flex direction="row">
                <Box width="75%" style={{ borderRight: "1px solid #ccc" }}>
                    <MapPanel />
                    <Separator style={{ width: "100%", margin: "10px 0" }} />
                    {/* RoomView removed from here */}
                </Box>
                <Box width="25%">
                    <RoomView /> {/* RoomView now placed here instead of StatusPanel */}
                </Box>
            </Flex>
            {/* Bottom section: Game Messages and Command Input - full width */}
            <Flex direction="column" width="100%" style={{ borderTop: "1px solid #ccc" }}>
                <GameMessagePanel />
                <CommandLine />
            </Flex>
        </Flex>
    )
};