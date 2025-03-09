"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Flex, Button } from "@radix-ui/themes";
import { PlayerCharacterList } from "./PlayerCharacterList.tsx";
import { CreateCharacterPanel } from "./CreateCharacterPanel.tsx";

export function StartMenu({ onConnect }: { onConnect: (url: string) => void }) {

    const { data: session } = useSession();
    const [showCreate, setShowCreate] = useState(false);
    const [listLoaded, setListLoaded] = useState(false); // new state to track if data is loaded

    if (!session) return <div>Not authenticated</div>

    return (
        <Flex direction="column" gap="3" align="start">
            {!showCreate && (
                <PlayerCharacterList 
                    onConnect={onConnect} 
                    onLoaded={() => setListLoaded(true)} // callback when data is loaded
                />
            )}
            {showCreate && (
                <CreateCharacterPanel onCreated={() => setShowCreate(false)} />
            )}
            {listLoaded && ( // render button only when list is loaded
                <Button color="indigo" onClick={() => setShowCreate(prev => !prev)}>
                    {showCreate ? "Back to character list" : "Create new character"}
                </Button>
            )}
        </Flex>
    )
}