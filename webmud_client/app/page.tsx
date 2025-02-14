import { auth } from "@/auth"
import { GameServiceProvider } from "../contexts/GameServiceContext";
import { SessionProvider } from "next-auth/react"
import * as React from "react";
import NavBar from "@/components/layout/navbar";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    session.user = {
      name: session.user.name,
      email: session.user.email,
      id: session.user.id,
    }
  }
  return (
    <SessionProvider basePath={"/auth"} session={session}>

        <div className="flex">
            <NavBar />
        </div>

    </SessionProvider>
  );
}
