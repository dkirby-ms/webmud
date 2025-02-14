"use client"
import { Avatar } from "@radix-ui/themes"
import { useSession } from "next-auth/react";

export function UserAvatar() {
  const { data: session, status } = useSession();
  if (!session) return null
  const username = session.user?.name || session.user?.email
  const avatar = session.user?.image

  return (
    <Avatar src="/avatar.png" alt="Avatar" fallback="S" />
  )
}