
import * as React from "react";
import { auth } from "@/auth";
import { Flex, Text } from "@radix-ui/themes";
import { StartMenu } from "@/components/home/StartMenu";

export default async function Home() {
const session = await auth(); 

  return (
    <>
      <Flex
        align="center"
        direction="column"
        gap="4"
        justify="center"
        style={{ minHeight: "100vh" }}
      >
        <StartMenu />
      </Flex>
  </>
  );
}
