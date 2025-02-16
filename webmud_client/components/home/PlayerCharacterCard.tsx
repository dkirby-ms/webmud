import React from 'react';
import { Card, Flex, Text, Box, Avatar } from "@radix-ui/themes";

interface PlayerCharacter {
    name: string;
    speciesName: string;
    playerLevel: number;
}

export const PlayerCharacterCard = ({ playerCharacter }: { playerCharacter: PlayerCharacter } ) => {
    
    return (
        <Box minWidth="180px">
            <Card>
                <Flex gap="3" align="center">
                    <Avatar
                        size="3"
                        src="https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?&w=64&h=64&dpr=2&q=70&crop=focalpoint&fp-x=0.67&fp-y=0.5&fp-z=1.4&fit=crop"
                        radius="full"
                        fallback={playerCharacter.name.charAt(0)}
                    />
                    <Box>
                        <Text as="div" size="2" weight="bold">
                            {playerCharacter.name}
                        </Text>
                        <Text as="div" size="2" color="gray">
                            {playerCharacter.speciesName}
                        </Text>
                        <Text as="div" size="1" color="gray">
                            Level {playerCharacter.playerLevel}
                        </Text>
                    </Box>
                </Flex>
            </Card>
        </Box>
    )
}