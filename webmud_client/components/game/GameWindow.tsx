"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Flex, Box } from "@radix-ui/themes";
import { ChatPanel } from "@/components/game/ChatPanel";
import { ActionPanel } from "@/components/game/ActionPanel";
import { StatusPanel } from "@/components/game/StatusPanel";

export function GameWindow() {

    const { data: session } = useSession();
    const [showCreate, setShowCreate] = useState(false);

    if (!session) return <div>Not authenticated</div>

    return (
        <Flex>
            <Box>GAME WINDOW</Box>
        </Flex>
    )
};