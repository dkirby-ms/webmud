import React from 'react';
import { Card, Text, Box, Inset, Strong } from "@radix-ui/themes";
import Image from "next/image"

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
                        <Image
                            src={`/${characterSpecies.imageUrl}`}
                            alt="Species portrait"
                            width={130}
                            height={130}
                            style={{
                                display: "block",
                                objectFit: "cover",
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