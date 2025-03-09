"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { Flex } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";
import { StickToBottom } from 'use-stick-to-bottom';

export function ChatPanel() {

    const { data: session } = useSession();
    const { globalChatMessages } = useGameService();

    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [globalChatMessages]);

    if (!session) return <div>Not authenticated</div>

    return (
        <Flex direction="column" gap="3" align="start" className="w-200" >
            <div>
                <StickToBottom className="w-full h-[25vh] relative" resize="smooth" initial="smooth">
                    <StickToBottom.Content className="flex flex-col gap-4">
                        {globalChatMessages.map((msg, index) => (
                            <div key={index}>
                                {msg}
                            </div>
                        ))}
                        <div ref={messageEndRef} />
                    </StickToBottom.Content>
                </StickToBottom>
            </div>
        </Flex>
    )
}