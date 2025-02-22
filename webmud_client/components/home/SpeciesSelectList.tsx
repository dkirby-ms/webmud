import React from 'react';
import useSWR from 'swr';
import { RadioCards } from "@radix-ui/themes";
import { CharacterSpeciesCard } from "@/components/home/CharacterSpeciesCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SpeciesSelectListProps {
    onSelect?: (value: string) => void;
  }

export function SpeciesSelectList({ onSelect }: SpeciesSelectListProps) {

    const host = process.env.HOST_URL || "";
    const key = host + "/api/db/characterSpecies";
    const { data, error } = useSWR(key, fetcher)
    if (!data) return <div>Loading...</div>;

    // Handle error state
    if (error) return <div>Failed to load data</div>;

    return (
        <RadioCards.Root defaultValue="1" onValueChange={(value) => onSelect && onSelect(value)}>
            {data.map((characterSpecies: any) => (
                <RadioCards.Item key={characterSpecies._id} value={characterSpecies._id}>
                    <CharacterSpeciesCard key={characterSpecies._id} characterSpecies={characterSpecies} />
                </RadioCards.Item>
            ))}
        </RadioCards.Root>
    )
}