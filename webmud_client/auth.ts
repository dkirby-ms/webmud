import NextAuth from "next-auth"
import AzureADB2C from "next-auth/providers/azure-ad-b2c"
import type { NextAuthConfig } from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
 
const BUFFER_TIME = 5 * 60;

const azureAdB2cTokenUrl = `https://bloodwar.ciamlogin.com/7a9da048-83f3-4666-8dbb-8ee824fcb897/oauth2/v2.0/token`;
const entraIdTokenUrl = ``;

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
    // AzureADB2C({
    //   id: 'azure-ad-b2c',
    //   name: 'Azure AD B2C',
    //   clientId: process.env.AZURE_AD_B2C_CLIENT_ID as string,
    //   issuer: `https://${process.env.AZURE_AD_B2C_TENANT_ID}.b2clogin.com/${process.env.AZURE_AD_B2C_TENANT_GUID}/v2.0/`,
    //   wellKnown: `https://${process.env.AZURE_AD_B2C_TENANT_ID}.b2clogin.com/${process.env.AZURE_AD_B2C_TENANT_ID}.onmicrosoft.com/${process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW}/v2.0/.well-known/openid-configuration`,
    //   authorization: {
    //     url: `https://${process.env.AZURE_AD_B2C_TENANT_ID}.b2clogin.com/${process.env.AZURE_AD_B2C_TENANT_ID}.onmicrosoft.com/${process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW}/oauth2/v2.0/authorize`,
    //     params: {
    //       scope: `offline_access openid ${process.env.AZURE_AD_B2C_CLIENT_ID}`,
    //     },
    //   },
    //   token: `https://${process.env.AZURE_AD_B2C_TENANT_ID}.b2clogin.com/${process.env.AZURE_AD_B2C_TENANT_ID}.onmicrosoft.com/${process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW}/oauth2/v2.0/token`,
    //   checks: ['pkce'],
    //   client: {
    //     token_endpoint_auth_method: 'none',
    //   },

    // }),
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

