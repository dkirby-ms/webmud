"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { Flex } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";
import { StickToBottom } from 'use-stick-to-bottom';

export function GameMessagePanel() {

    const { data: session } = useSession();
    const { gameState } = useGameService();

    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState]);

    if (!session) return <div>Not authenticated</div>

    return (
        
        <Flex direction="column" gap="3" align="start" className="w-200" >
            {gameState.gameMessages && (
            <div>
                <StickToBottom className="w-full h-[25vh] relative" resize="smooth" initial="smooth">
                    <StickToBottom.Content className="flex flex-col gap-4">
                    
                        {gameState.gameMessages.map((msg: string, index: number) => (
                            <div key={index}>
                                {msg}
                            </div>
                        ))}
                        <div ref={messageEndRef} />
                    </StickToBottom.Content>
                </StickToBottom>
            </div>
            )}
        </Flex>
    )
}