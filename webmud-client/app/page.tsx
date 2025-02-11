import { auth } from "auth"
import { SessionProvider } from "next-auth/react"
import ConnectionBar from './components/connectionBar'
import ChatConsole from './components/chatConsole'
import ActionPanel from './components/actionPanel'
import { GameServiceProvider } from "./contexts/GameServiceContext";
import * as React from "react";
import { Tabs } from "radix-ui";
import PlayersPanel from "./components/playersPanel"; // new import

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
    <SessionProvider basePath={"/auth"} session={session}>
      <GameServiceProvider>
        <div className="flex">
          <div className="flex-grow">
            <ActionPanel className="bg-gray-800 text-gray-200 p-4 rounded-t" />
            <Tabs.Root defaultValue="world">
              <Tabs.List
                className="flex space-x-2 bg-gray-100 dark:bg-gray-900 p-2 rounded"
                aria-label="Chat Channels"
              >
                <Tabs.Trigger
                 value="world"
                 className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  World
                </Tabs.Trigger>
                <Tabs.Trigger
                 value="global"
                 className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Global
                </Tabs.Trigger>
                <Tabs.Trigger
                 value="private"
                 className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Private
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="world">
                <ChatConsole channel="world" />
              </Tabs.Content>
              <Tabs.Content value="global">
                <ChatConsole channel="global" />
              </Tabs.Content>
              <Tabs.Content value="private">
                <ChatConsole channel="private" />
              </Tabs.Content>
            </Tabs.Root>
          </div>
          <PlayersPanel />
        </div>
      </GameServiceProvider>
    </SessionProvider>
  )
}
