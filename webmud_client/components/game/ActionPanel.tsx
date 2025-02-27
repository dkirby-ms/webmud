"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Flex, Box } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";

export function ActionPanel() {

    const { data: session } = useSession();
    const { gameState } = useGameService();
    useEffect(() => {
        // Subscribe to the game state
    }, [gameState]);

    if (!session) return <div>Not authenticated</div>

    if (!gameState) return <div>Loading...</div>

    return (
        <Flex>
            <Box>{gameState.room}</Box>
            <Box>{gameState.roomDescription}</Box>
        </Flex>
    )
};