import React from 'react';
import useSWR from 'swr';
import { Select } from "@radix-ui/themes";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CharCreateWorldSelectProps {
    onSelect?: (value: string) => void;
  }

export function CharCreateWorldSelect({ onSelect }: CharCreateWorldSelectProps) {

    const host = process.env.HOST_URL || "";
    const key = host + "/api/db/gameWorlds";
    const { data, error } = useSWR(key, fetcher)
    if (!data) return <div>Loading...</div>;

    // Handle error state
    if (error) return <div>Failed to load data</div>;

    return (

        <Select.Root size="3" onValueChange={(value) => onSelect && onSelect(value)}>
            <Select.Trigger placeholder="Select world..." />
            <Select.Content>
                {/* <Select.Group>
                    <Select.Label>Fruits</Select.Label>
                    <Select.Item value="orange">Orange</Select.Item>
                    <Select.Item value="apple">Apple</Select.Item>
                    <Select.Item value="grape" disabled>
                        Grape
                    </Select.Item>
                </Select.Group>
                <Select.Separator /> */}
                <Select.Group>
                    <Select.Label>DevTest worlds</Select.Label>
                    {data.map((world: any) => (
                        <Select.Item key={world._id} value={world._id}>{world.name}</Select.Item>
                    ))}
                </Select.Group>
            </Select.Content>
        </Select.Root>


    )
}