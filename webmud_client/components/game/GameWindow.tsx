"use client";
import { useSession } from "next-auth/react";
import { Flex, Box } from "@radix-ui/themes";
import { ChatPanel } from "./ChatPanel.tsx";
import { ActionPanel } from "./ActionPanel.tsx";
import { StatusPanel } from "./StatusPanel.tsx";
import { CommandLine } from "./CommandLine.tsx";

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
            <Flex direction="column" style={{ borderTop: "1px solid #ccc" }}>
                <ChatPanel />
                <CommandLine />
            </Flex>
        </Flex>
    )
};