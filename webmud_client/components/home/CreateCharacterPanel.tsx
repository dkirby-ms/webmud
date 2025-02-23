"use client";

import React, { useState } from 'react';
import { Flex, Button, TextField } from "@radix-ui/themes";
import { SpeciesSelectList } from "./SpeciesSelectList.tsx";
import { CharCreateWorldSelect } from "./CharCreateWorldSelect.tsx";
import { createCharacter } from "../../actions/characterActions.ts";
import { useSession } from "next-auth/react";

interface CreateCharacterPanelProps {
  onCreated?: () => void;
}

export function CreateCharacterPanel({ onCreated }: CreateCharacterPanelProps) {
  const [species, setSpecies] = useState("");
  const [world, setWorld] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [error, setError] = useState("");
  const { status } = useSession();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (status !== "authenticated") {
      setError("You must be logged in to create a character.");
      return;
    }
    if (!/^[A-Za-z]+$/.test(characterName)) {
      setError("Name must contain only letters with no spaces.");
      return;
    }
    if (!species || !world) {
      setError("Please select both a species and a world.");
      return;
    }
    setError("");
    
    // Gather form data
    const formData = new FormData(e.currentTarget);
    // Call server action
    const success = await createCharacter(formData);
    
    if (success) {
      if (onCreated) onCreated();
    } else {
      setError("Failed to create character.");
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacterName(e.target.value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex gap="1" direction="row" align="center">
        {/* Capture species and world using callbacks */}
        <SpeciesSelectList onSelect={(value) => setSpecies(value)} />
        <TextField.Root value={characterName} onChange={handleNameChange} size="3" placeholder="Enter character name..." />
        <CharCreateWorldSelect onSelect={(value) => setWorld(value)} />
        {/* Hidden inputs so species and world are included in the form submission */}
        <input type="hidden" name="name" value={characterName} />
        <input type="hidden" name="species" value={species} />
        <input type="hidden" name="world" value={world} />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <Button size="3" color="indigo" type="submit">
          Create Character
        </Button>
      </Flex>
    </form>
  )
}