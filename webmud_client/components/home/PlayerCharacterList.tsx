
import React from 'react';
import { auth } from "@/auth";
import { Flex, Box, Button } from "@radix-ui/themes";
import { PlayerCharacterCard } from "@/components/home/PlayerCharacterCard";

export async function PlayerCharacterList() {

    const session = await auth() as any;

    const host = process.env.HOST_URL || "";
    if (!session) return <div>Not authenticated</div>
    let data = await fetch(`${host}/api/db/playerCharacters?userId=${session.userId}`);
    let playerCharacters = await data.json()

    return (
        <Flex gap="1" direction='column' align='center'>
            {playerCharacters.map((playerCharacter: any) => (
                <PlayerCharacterCard key={playerCharacter._id} playerCharacter={playerCharacter} />
            ))}
        </Flex>
    )
}