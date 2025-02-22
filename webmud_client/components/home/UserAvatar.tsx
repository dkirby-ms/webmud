"use client"
import { Avatar } from "@radix-ui/themes"
import { signOut, useSession } from "next-auth/react";
import { Popover, Flex, Text, Box, Button } from "@radix-ui/themes";

export function UserAvatar() {
  const { data: session } = useSession();
  if (!session) return null
  const username = session.user?.name || session.user?.email
  const initials = username?.split(" ").map((n) => n[0]).join("").toUpperCase()
  const userId = session.userId
  const handleLogout = () => {
    signOut(); // signin using next-auth with configured AADB2C provider
  };
  return (

    <Popover.Root>
      <Popover.Trigger>
        <Box>
          <Avatar
            size="2"
            fallback={initials || "-"}
            radius="full"
          />
        </Box>
      </Popover.Trigger>
      <Popover.Content width="360px">
        <Flex gap="2">
          <Avatar
            size="2"
            fallback={initials || "-"}
            radius="full"
          />
          <Box flexGrow="5">
            <Flex gap="2" mt="1" justify="between">
              <Text size="2" weight="medium">Signed in as {userId}</Text>
              <Popover.Close>
                <Button size="2" onClick={handleLogout}>Sign out</Button>
              </Popover.Close>
            </Flex>
          </Box>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  )
}