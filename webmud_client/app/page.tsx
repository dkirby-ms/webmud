"use client";
import React, { useState } from "react";
import { Flex } from "@radix-ui/themes";
import { StartMenu } from "@/components/home/StartMenu";
import { GameWindow } from "@/components/game/GameWindow";
import { GameServiceProvider, useGameService } from "@/contexts/GameServiceContext"; // ensure this path is correct

export default function Home() {
  const [inGame, setInGame] = useState(false);
  const { connect } = useGameService();
  const handleConnect = (url: string) => {
    setInGame(true);
    connect(url);
  };

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
