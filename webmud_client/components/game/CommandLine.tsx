"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Box } from "@radix-ui/themes";
import { useGameService } from "../../contexts/GameServiceContext.tsx";
import { MessageTypes } from "../../lib/messageTypes";

export function CommandLine() {

    const { data: session } = useSession();
    const { socket } = useGameService();

    const [input, setInput] = useState('');

    const handleSendCommand = () => {
        if (input.trim() && socket) {
            // Emit the message to the server using MessageTypes constant
            socket.emit(MessageTypes.command.SEND_COMMAND, input);
            setInput('');
        }
    };

    if (!session) return <div>Not authenticated</div>

    return (
        <Box className="width-full">
            <input className="w-full"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                placeholder="Command..."
            />
            <button onClick={handleSendCommand}>Send</button>
        </Box>
    )
}