"use client";
import { useSession } from "next-auth/react";
import { Flex, Box } from "@radix-ui/themes";

export function ActionPanel() {

    const { data: session } = useSession();

    if (!session) return <div>Not authenticated</div>

    return (
        <Flex>
            <Box>ACTION PANEL</Box>
        </Flex>
    )
};