"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { Flex, Box, Text, Strong } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";
import { StickToBottom } from 'use-stick-to-bottom';

export function ActionPanel() {

    const { data: session } = useSession();
    const { gameState } = useGameService();
    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Subscribe to the game state
        //messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState]);

    if (!session) return <div>Not authenticated</div>

    if (!gameState) return <div>Loading...</div>

    return (
        <Flex direction="column">
            <Box><Strong>{gameState.room}</Strong></Box>
            <Box><Text>{gameState.roomDescription}</Text></Box>
            {gameState.gameMessages && (
                <Box>
                    <StickToBottom className="h-[50vh] relative" resize="smooth" initial="smooth">
                        <StickToBottom.Content className="flex flex-col gap-4">
                            {gameState.gameMessages.map((msg: string, index: string) => (
                                <div key={index}>
                                    {msg}
                                </div>
                            ))}
                            <div ref={messageEndRef} />
                        </StickToBottom.Content>
                    </StickToBottom>
                </Box>
            )}
        </Flex>
    )
};