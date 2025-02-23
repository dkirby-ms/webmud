import React from 'react';
import useSWR from 'swr';
import { Flex, RadioCards, Box, Card, Button, Text, Strong } from "@radix-ui/themes";
import { PlayerCharacterCard } from "@/components/home/PlayerCharacterCard";
import { useState } from "react";
import { useGameService } from "@/contexts/GameServiceContext"; // ensure this path is correct

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PlayerCharacterList({ onConnect }: { onConnect: (url: string) => void }) {
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

    React.useEffect(() => {
        if (data && data.length > 0 && !selectedCharId) {
            handleSelect(data[0]._id);
        }
    }, [data, selectedCharId]);

    if (!data) return <div>Loading...</div>;

    // Handle error state
    if (error) return <div>Failed to load data</div>;

    return (
        <Flex gap="5" align='center' width="100%">
            <Box>
                <RadioCards.Root defaultValue="1" onValueChange={handleSelect}>
                    {data.map((playerCharacter: any) => (
                        <RadioCards.Item key={playerCharacter._id} value={playerCharacter._id}>
                            <PlayerCharacterCard key={playerCharacter._id} playerCharacter={playerCharacter} />
                        </RadioCards.Item>
                    ))}
                </RadioCards.Root>
            </Box>
            
            {selectedCharId && (
                <Flex>
                    <Card size="4">
                        <Flex gap="5" direction="column" align="center" >
                        <Text size="4">
                            <Strong>{data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.name}</Strong>
                        </Text>
                        <Flex direction="column" align="center" gap="2">
                        <Text size="3">
                            Level&nbsp;{data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.playerLevel}&nbsp;{data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.speciesName}
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