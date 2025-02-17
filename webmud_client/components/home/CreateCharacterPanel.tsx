"use client";

import React, { useState } from 'react';
import { Flex, Button, TextField } from "@radix-ui/themes";
import { SpeciesSelectList } from "@/components/home/SpeciesSelectList";
import { CharCreateWorldSelect } from "@/components/home/CharCreateWorldSelect";
import { createCharacter } from "@/actions/characterActions";
import { useSession } from "next-auth/react";

export function CreateCharacterPanel() {
  const [species, setSpecies] = useState("");
  const [world, setWorld] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [error, setError] = useState("");
  const { data, status } = useSession();

  // Client-side validation on form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (status !== "authenticated") {
      e.preventDefault();
      setError("You must be logged in to create a character.");
      return;
    }

    if (!/^[A-Za-z]+$/.test(characterName)) {
      e.preventDefault();
      setError("Name must contain only letters with no spaces.");
      return;
    }
    // checkText(characterName);
    // if (result.containsProfanity) {
    //   e.preventDefault();
    //   setError("Name contains inappropriate word for this game's setting. Please choose a different name.");
    // }

    if (!species || !world) {
      e.preventDefault();
      setError("Please select both a species and a world.");
      return;
    }
    setError("");
    // When the form is submitted, the action prop will call createCharacter on the server.
    // The browser will then submit the form data (including hidden fields).
  };
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacterName(e.target.value);
  }
  return (
    <form action={createCharacter} onSubmit={handleSubmit}>

      <Flex gap="1" direction="column" align="center">
        {/* Capture species and world using callbacks */}
        <SpeciesSelectList onSelect={(value) => { setSpecies(value) }} />
        <TextField.Root value={characterName} onChange={handleNameChange} size="3" placeholder="Enter character name..." />
        <CharCreateWorldSelect onSelect={(value) => { setWorld(value) }} />
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