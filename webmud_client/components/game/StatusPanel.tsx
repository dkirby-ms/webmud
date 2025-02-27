"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Flex, Box } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";

export function StatusPanel() {

    const { data: session } = useSession();
    const { gameState } = useGameService();
    if (!session) return <div>Not authenticated</div>
    if (!gameState) return <div>Loading...</div>

    useEffect(() => {
        // Subscribe to the game state
    }, [gameState]);

    return (
        <Flex>
            <Box>Health: { gameState.health } / { gameState.maxHealth } </Box>
        </Flex>
    )
}