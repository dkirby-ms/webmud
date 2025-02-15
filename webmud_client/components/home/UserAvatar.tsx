"use client"
import { Avatar } from "@radix-ui/themes"
import { signOut, useSession } from "next-auth/react";
import { Popover, Flex, TextArea, Text, Box, Checkbox, Button } from "@radix-ui/themes";

export function UserAvatar() {
  const { data: session, status } = useSession();
  if (!session) return null
  const username = session.user?.name || session.user?.email
  const avatar = session.user?.image
  const initials = username?.split(" ").map((n) => n[0]).join("").toUpperCase()
  const userId = session.userId
  const handleLogout = () => {
    signOut(); // signin using next-auth with configured AADB2C provider
  };
  return (
    
    <Popover.Root>
      <Popover.Trigger>
          <Avatar
            size="2"
            src="https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?&w=64&h=64&dpr=2&q=70&crop=focalpoint&fp-x=0.67&fp-y=0.5&fp-z=1.4&fit=crop"
            fallback={initials || "-"} 
            radius="full"
          />
      </Popover.Trigger>
      <Popover.Content width="360px">
        <Flex gap="2">
          <Avatar
            size="2"
            src="https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?&w=64&h=64&dpr=2&q=70&crop=focalpoint&fp-x=0.67&fp-y=0.5&fp-z=1.4&fit=crop"
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