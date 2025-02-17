import React from 'react';
import { Card, Flex, Text, Box, Avatar } from "@radix-ui/themes";

interface PlayerCharacter {
    name: string;
    speciesName: string;
    playerLevel: number;
}

export const PlayerCharacterCard = ({ playerCharacter }: { playerCharacter: PlayerCharacter } ) => {
    
    return (
        <Box minWidth="200px">
            <Card>
                <Flex gap="3" align="center">
                    <Avatar
                        size="3"
                        radius="full"
                        fallback={playerCharacter.name.charAt(0)}
                    />
                    <Box>
                        <Text as="div" size="3" weight="bold">
                            {playerCharacter.name}
                        </Text>
                        <Text as="div" size="3" color="gray">
                            {playerCharacter.speciesName}
                        </Text>
                        <Text as="div" size="2" color="gray">
                            Level {playerCharacter.playerLevel}
                        </Text>
                    </Box>
                </Flex>
            </Card>
        </Box>
    )
}