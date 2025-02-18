"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Flex, Button } from "@radix-ui/themes";
import { PlayerCharacterList } from "@/components/home/PlayerCharacterList";
import { CreateCharacterPanel } from "@/components/home/CreateCharacterPanel";

interface StartMenuProps {
    onConnect?: (url: string) => void;
}

export function StartMenu({ onConnect }: StartMenuProps) {

    const { data: session } = useSession();
    const [showCreate, setShowCreate] = useState(false);

    if (!session) return <div>Not authenticated</div>

    return (
        <Flex direction="column" gap="3" align="start">
            {!showCreate && (
                <PlayerCharacterList onConnect={onConnect} />
            )}
            {showCreate && <CreateCharacterPanel />}
            <Button color="indigo" onClick={() => setShowCreate((prev) => !prev)}>
                {showCreate ? "Back to character list" : "Create new character"}
            </Button>
        </Flex>
    )
}