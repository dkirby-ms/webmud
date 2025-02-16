import useSWR from 'swr';
import React from 'react';
import { Flex, Box, TextField } from "@radix-ui/themes";
import { SpeciesSelectList } from "@/components/home/SpeciesSelectList";

export function CreateCharacterPanel() {

    return (
        <Flex gap="1" direction='column' align='center'>
            <TextField.Root placeholder="Character name...">
                <TextField.Slot>
                    
                </TextField.Slot>
            </TextField.Root>
            <SpeciesSelectList />

        </Flex>
    )
}