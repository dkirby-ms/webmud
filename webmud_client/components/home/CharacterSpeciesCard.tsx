import React from 'react';
import { Card, Flex, Text, Box, Inset, Strong } from "@radix-ui/themes";

interface CharacterSpecies {
    name: string;
    description: string;
    imageUrl: string;
}

export const CharacterSpeciesCard = ({ characterSpecies }: { characterSpecies: CharacterSpecies }) => {
    return (
        <>
            <Box maxWidth="200px">
                <Card size="1">
                    <Inset clip="padding-box" side="top" pb="current">
                        <img
                            src={`/${characterSpecies.imageUrl}`}
                            alt="Species portrait"
                            style={{
                                display: "block",
                                objectFit: "cover",
                                width: "100%",
                                height: 100,
                                backgroundColor: "var(--gray-5)",
                            }}
                        />
                    </Inset>
                    <Text as="p" size="2">
                        <Strong>{characterSpecies.name}</Strong>-&nbsp;{characterSpecies.description}
                    </Text>
                </Card>
            </Box></>
    )
}