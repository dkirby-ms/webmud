"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Flex, Button } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";
import { StickToBottom } from 'use-stick-to-bottom';

export function GameMessagePanel() {
    const { data: session } = useSession();
    const { gameState } = useGameService();
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [hasNewMessages, setHasNewMessages] = useState(false);

    // Remove the previous messageEndRef and useEffect - StickToBottom handles this

    // Track when new messages arrive while scrolled up
    if (!isAtBottom && gameState.gameMessages && gameState.gameMessages.length > 0) {
        setHasNewMessages(true);
    }

    const scrollToBottom = () => {
        setHasNewMessages(false);
        // The StickToBottom will handle the actual scrolling
        setIsAtBottom(true);
    };

    if (!session) return <div>Not authenticated</div>

    return (
        <Flex direction="column" gap="3" align="start" width="100%">
            {gameState.gameMessages && (
            <div style={{ width: '100%', position: 'relative' }}>
                <StickToBottom 
                    className="w-full h-[25vh] relative" 
                    resize="smooth" 
                >
                    <StickToBottom.Content className="flex flex-col gap-4 w-full">
                        {gameState.gameMessages.map((msg: string, index: number) => (
                            <div key={index} className="w-full">
                                {msg}
                            </div>
                        ))}
                    </StickToBottom.Content>
                </StickToBottom>
                
                {hasNewMessages && !isAtBottom && (
                    <Button 
                        size="1" 
                        onClick={scrollToBottom}
                        className="absolute bottom-2 right-2 bg-blue-500 text-white px-2 py-1 rounded shadow-md"
                    >
                        ↓ New messages
                    </Button>
                )}
            </div>
            )}
        </Flex>
    )
}