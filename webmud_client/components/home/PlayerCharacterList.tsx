import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Flex, RadioCards, Box, Card, Button, Text, Strong } from "@radix-ui/themes";
import { PlayerCharacterCard } from "./PlayerCharacterCard.tsx";
import { useGameService } from "../../contexts/GameServiceContext.tsx"; // ensure this path is correct

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PlayerCharacterList({ onConnect, onLoaded }: { onConnect: (url: string) => void, onLoaded: () => void }) {
    const { connect } = useGameService();
    const host = process.env.HOST_URL || "";
    const key = host + "/api/db/playerCharacters";
    const { data, error } = useSWR(key, fetcher);
    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
    
    const handleSelect = (value: string) => {
        setSelectedCharId(value);
    };

    const handleConnect = (url: string) => {
        const selectedChar = data.find((playerCharacter: any) => playerCharacter._id === selectedCharId);
        connect(selectedChar.worldUrl, selectedChar._id);
        onConnect(url);
    };

    useEffect(() => {
        if (data && data.length > 0 && !selectedCharId) {
            handleSelect(data[0]._id);
            onLoaded();
        }
    }, [data, selectedCharId, onLoaded]);

    if (!data) return <div>Loading...</div>;
    if (error) return <div>Failed to load data</div>;

    return (
        <Flex gap="5" align='center' width="100%">
            <Box>
                <RadioCards.Root defaultValue="1" onValueChange={handleSelect}>
                    {data.map((playerCharacter: any) => (
                        <RadioCards.Item key={playerCharacter._id} value={playerCharacter._id}>
                            <PlayerCharacterCard playerCharacter={playerCharacter} />
                        </RadioCards.Item>
                    ))}
                </RadioCards.Root>
            </Box>
            
            {selectedCharId && (
                <Flex>
                    <Card size="4">
                        <Flex gap="5" direction="column" align="center">
                            <Text size="4">
                                <Strong>{data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.name}</Strong>
                            </Text>
                            <Flex direction="column" align="center" gap="2">
                                <Text size="3">
                                    Level {data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.playerLevel} {data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.speciesName}
                                </Text>
                                <Text size="2" color="gray">
                                    {data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.worldName}
                                </Text>
                                <Flex gap="2" justify="end">
                                    <Button 
                                        color="green" 
                                        variant="solid" 
                                        onClick={() =>
                                            handleConnect(
                                                data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)
                                                  .worldUrl
                                            )
                                        }
                                    >
                                        Connect
                                    </Button>
                                    <Button variant="soft">Delete</Button>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Card>
                </Flex>
            )}
        </Flex>
    )
}