"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Flex, Box } from "@radix-ui/themes";

export function ActionPanel() {

    const { data: session } = useSession();
    const [showCreate, setShowCreate] = useState(false);

    if (!session) return <div>Not authenticated</div>

    return (
        <Flex>
            <Box>ACTION PANEL</Box>
        </Flex>
    )
};