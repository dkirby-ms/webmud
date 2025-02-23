import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    userId: string,
    user: {
        /** The user's postal address. */
        characters: string[]
    } & DefaultSession["user"]
  }

  

  interface NextAuthConfig {
    /**
     * An array of authentication providers.
     */
    providers: Provider[],
    theme: { logo: string },
    basePath: string,
    callbacks: {
      jwt: (token: any, trigger?: string, session?: any, account?: any) => Promise<any>,
      session: (session: any, token: any) => Promise<any>
    } 
  }
}