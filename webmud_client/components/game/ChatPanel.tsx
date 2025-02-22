"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Flex } from "@radix-ui/themes";
import { useGameService } from "@/contexts/GameServiceContext.js";
import { StickToBottom } from 'use-stick-to-bottom';

export function ChatPanel() {

    const { data: session } = useSession();
    const { socket, globalChatMessages } = useGameService();

    const [input, setInput] = useState('');
    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [globalChatMessages]);

    const handleSendMessage = () => {
        if (input.trim() && socket) {
            // Emit the message to the server
            socket.emit('chat:send', input);
            setInput('');
        }
    };

    if (!session) return <div>Not authenticated</div>

    return (
        <Flex direction="column" gap="3" align="start">
            <div>
                <div>
                    <StickToBottom className="h-[50vh] relative" resize="smooth" initial="smooth">
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
                <div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                    />
                    <button onClick={handleSendMessage}>Send</button>
                </div>
            </div>

        </Flex>
    )
}