"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { Flex, Box, Text, Heading, Separator } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";
import { StickToBottom } from 'use-stick-to-bottom';
import { MapPanel } from "./MapPanel.tsx";
export function ActionPanel() {

    const { data: session } = useSession();
    const { gameState } = useGameService();
    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Subscribe to the game state
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState]);

    if (!session) return <div>Not authenticated</div>

    if (!gameState) return <div>Loading...</div>

    return (
        <Flex direction="column">
            <Box><MapPanel></MapPanel></Box>
            <Separator style={{ width: "73vw", position: "relative", left: "50%", transform: "translateX(-50%)" }} />
            
            {/* Display the current room name and description */}
            <Box><Heading size="4">{gameState.room}</Heading></Box>
            
            <Box style={{ minHeight: "100px" }}><Text>{gameState.roomDescription}</Text></Box>
            <Box><Text>
            {gameState.roomExits && (
                <>Exits: {Object.keys(gameState.roomExits).join(", ")}</>
            )}</Text></Box>
            {/* <Separator style={{ width: "73vw", position: "relative", left: "50%", transform: "translateX(-50%)" }} />
            {gameState.gameMessages && (
                <Box>
                    <StickToBottom className="h-[35vh] relative" resize="smooth" initial="smooth">
                        <StickToBottom.Content className="flex flex-col gap-3">
                            {gameState.gameMessages.map((msg: string, index: string) => (
                                <div key={index}>
                                    {msg}
                                </div>
                            ))}
                            <div ref={messageEndRef} />
                        </StickToBottom.Content>
                    </StickToBottom>
                </Box>
            )} */}
        </Flex>
    )
};