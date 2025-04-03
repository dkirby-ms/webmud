import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
 
const BUFFER_TIME = 5 * 60;

const azureAdB2cTokenUrl = `https://bloodwar.ciamlogin.com/7a9da048-83f3-4666-8dbb-8ee824fcb897/oauth2/v2.0/token`;

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(azureAdB2cTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID as string,
        refresh_token: token.refreshToken as string,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      token.accessToken = data.access_token;
      token.refreshToken = data.refresh_token;
      token.tokenExpiresAt = Math.floor(
        data.expires_in + Date.now() / 1000
      );
    }
  } catch (error) {
    console.error('Failed to refresh access token', error);
    token.error = 'RefreshAccessTokenError';
  }

  return token;
}

export const config = {
  theme: {
    logo: "https://next-auth.js.org/img/logo/logo-sm.png",
  },
  // adapter: MongoDBAdapter(client),
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      token: process.env.AUTH_MICROSOFT_ENTRA_ID_TOKEN,
      //userinfo: process.env.AUTH_MICROSOFT_ENTRA_ID_USERINFO,
      authorization: {
        url: process.env.AUTH_MICROSOFT_ENTRA_ID_AUTHORIZATION_URL,
        params: {
          scope: "openid profile email offline_access",
        },
      },
    }),
    
  ],
  trustHost: true,
  basePath: "/auth",
  callbacks: {
    async jwt({ token, trigger, session, account }: { token: any, trigger?: string, session?: any, account?: any }) {
      if (trigger === "update") token.name = session.user.name;
    
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.tokenExpiresAt = account.expires_at;
        token.id = account.providerAccountId;
      }
    
      if (Date.now() / 1000 < (token.tokenExpiresAt as number) - BUFFER_TIME) {
        return token;
      }
    
      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: any, token: any }) {
      return {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        tokenExpiresAt: token.tokenExpiresAt,
        userId: token.id,
        user: {
          ...session.user,
        },
      }
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
