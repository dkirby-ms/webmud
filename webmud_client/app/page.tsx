
import * as React from "react";
import { auth } from "@/auth";
import { Flex, Text } from "@radix-ui/themes";
export default async function Home() {
const session = await auth(); 

if (!session) return null

let data = await fetch('/api/db/playerCharacters')
let playerCharacters = await data.json()


  return (
    <>
      <Flex
        align="center"
        direction="column"
        gap="4"
        justify="center"
        style={{ minHeight: "100vh" }}
      >
        { if }
      </Flex>
  </>
  );
}
