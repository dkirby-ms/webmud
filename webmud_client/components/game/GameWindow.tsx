"use client";
import { useSession } from "next-auth/react";
import { Flex, Box } from "@radix-ui/themes";
import { ChatPanel } from "@/components/game/ChatPanel";
import { ActionPanel } from "@/components/game/ActionPanel";
import { StatusPanel } from "@/components/game/StatusPanel";

export function GameWindow() {

    const { data: session } = useSession();

    if (!session) return <div>Not authenticated</div>

    return (
        <Flex direction="column" gap="0" height="100%" width="100%" >
            {/* Top section: ActionPanel and StatusPanel */}
            <Flex direction="row">
                <Box width="75%" style={{ borderRight: "1px solid #ccc" }}>
                    <ActionPanel />
                </Box>
                <Box width="25%">
                    <StatusPanel />
                </Box>
            </Flex>
            {/* Bottom section: ChatPanel */}
            <Flex style={{ borderTop: "1px solid #ccc" }}>
                <ChatPanel />
            </Flex>
        </Flex>
    )
};