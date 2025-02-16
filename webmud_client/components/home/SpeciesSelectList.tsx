import React from 'react';
import useSWR from 'swr';
import { Box, RadioCards, Flex } from "@radix-ui/themes";
import { CharacterSpeciesCard } from "@/components/home/CharacterSpeciesCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
 
export function SpeciesSelectList() {

    const host = process.env.HOST_URL || "";
    const key = host + "/api/db/characterSpecies";
    const { data, error } = useSWR(key, fetcher)
    if (!data) return <div>Loading...</div>;

    // Handle error state
    if (error) return <div>Failed to load data</div>;

    return (

        <Box>
            <RadioCards.Root defaultValue="1">
                {data.map((characterSpecies: any) => (
                    <RadioCards.Item key={characterSpecies._id} value={characterSpecies._id}>
                    
                <CharacterSpeciesCard key={characterSpecies._id} characterSpecies={characterSpecies} />

                </RadioCards.Item>
                ))}
            </RadioCards.Root>

        </Box>


    )
}