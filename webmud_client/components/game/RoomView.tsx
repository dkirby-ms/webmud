"use client";
import { useSession } from "next-auth/react";
import { Box, Text, Heading } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";
import { EntityList } from "./EntityList.tsx";

export function RoomView() {
    const { data: session } = useSession();
    const { gameState } = useGameService();

    if (!session) return <div>Not authenticated</div>
    if (!gameState) return <div>Loading...</div>

    return (
        <Box className="room-view">
            {/* Display the current room name and description */}
            <Box><Heading size="4">{gameState.room}</Heading></Box>
            
            <Box style={{ minHeight: "100px" }}><Text>{gameState.roomDescription}</Text></Box>
            <Box><Text>
            {gameState.roomExits && (
                <>Exits: {Object.keys(gameState.roomExits).join(", ")}</>
            )}</Text></Box>
            
            {/* Add EntityList component */}
            <Box p="2">
                <EntityList />
            </Box>
        </Box>
    );
}
