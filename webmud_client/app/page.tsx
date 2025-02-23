"use client";
import React, { useState } from "react";
import { Flex } from "@radix-ui/themes";
import { StartMenu } from "../components/home/StartMenu.tsx";
import { GameWindow } from "../components/game/GameWindow.tsx";
import { GameServiceProvider } from "../contexts/GameServiceContext.tsx"; // ensure this path is correct

export default function Home() {
  const [inGame, setInGame] = useState(false);

  const handleConnect = () => {
    setInGame(true);
  }
  return (
    <GameServiceProvider>
      <Flex align="center" direction="column" gap="4" justify="center" style={{ minHeight: "100vh" }}>
        {!inGame ? (
          <StartMenu onConnect={handleConnect} />
        ) : (
          <GameWindow />
        )}
      </Flex>
    </GameServiceProvider>
  );
}
