import React from 'react';
import useSWR from 'swr';
import { Flex, RadioCards, Box, Card, Button, Text, Strong } from "@radix-ui/themes";
import { PlayerCharacterCard } from "@/components/home/PlayerCharacterCard";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PlayerCharacterListProps {
    onSelect?: (value: string) => void;
}

export function PlayerCharacterList({ onSelect }: PlayerCharacterListProps) {
    
    const host = process.env.HOST_URL || "";
    const key = host + "/api/db/playerCharacters";
    const { data, error } = useSWR(key, fetcher)
    const [ selectedCharId, setSelectedCharId ] = useState<string | null>(null);
    
    const handleSelect = (value: string) => {
        setSelectedCharId(value);
        if (onSelect) onSelect(value);
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
                <Box>
                    <Card size="2">
                        <Text as="p" size="3">
                            <Strong>Name</Strong>&nbsp;{data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.name}
                        </Text>
                        <Text as="p" size="3">
                            <Strong>Species</Strong>&nbsp;{data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.speciesName}
                        </Text>
                        <Text as="p" size="3">
                            <Strong>Level</Strong>&nbsp;{data.find((playerCharacter: any) => playerCharacter._id === selectedCharId)?.level}
                        </Text>
                        <Text as="p" size="3">
                            <Strong>Location</Strong>&nbsp;Home
                        </Text>
                        <Flex gap="2" justify="end">
                            <Button color="green">Connect</Button>
                            <Button>Delete</Button>
                        </Flex>
                    </Card>
                </Box>
            )}
        </Flex>
    )
}