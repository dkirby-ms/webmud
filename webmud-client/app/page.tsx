import { auth } from "auth"
import { SessionProvider } from "next-auth/react"
import ConnectionBar from './components/connectionBar'
import ChatConsole from './components/chatConsole'
import ActionPanel from './components/actionPanel'
import { SocketProvider } from "./contexts/SocketContext";

export default async function webMUDClient() {
  const session = await auth()
  if (session?.user) {
    // TODO: Look into https://react.dev/reference/react/experimental_taintObjectReference
    // filter out sensitive data before passing to client.
    session.user = {
      name: session.user.name,
      email: session.user.email,
    }
  }

  return (
    <>
      <SessionProvider basePath={"/auth"} session={session}>
        <SocketProvider>
        <div>
          <ConnectionBar />
          <ActionPanel messages={[]}/>
          <ChatConsole messages={[]} />
        </div>
        </SocketProvider>
      </SessionProvider>
    </>
  )
}
