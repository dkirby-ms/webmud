"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Flex, Box } from "@radix-ui/themes";
import { useGameService } from "@/contexts/GameServiceContext";

export function ChatPanel() {

    const { data: session } = useSession();
    const [showCreate, setShowCreate] = useState(false);
    const { socket, connectionStatus } = useGameService();

    
    if (!session) return <div>Not authenticated</div>

    return (
        <Flex direction="column" gap="3" align="start">
            <Box>Chat</Box>
            
        </Flex>
    )
}