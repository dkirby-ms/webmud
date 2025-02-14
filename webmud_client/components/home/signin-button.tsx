"use client"
import { signIn } from "next-auth/react"
import { Button } from "@radix-ui/themes"

export function SignInButton() {
  const handleLogin = () => {
    signIn(); // signin using next-auth with configured AADB2C provider
  };

  return (
    <Button variant="classic" onClick={handleLogin} size="3">
        Sign in
    </Button>
  )
}