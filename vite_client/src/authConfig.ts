import type { Configuration, PopupRequest } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AUTH_MICROSOFT_ENTRA_ID_ID,
    authority: `https://${import.meta.env.VITE_AUTH_MICROSOFT_ENTRA_ID_TENANT_SUB_DOMAIN}.ciamlogin.com/${import.meta.env.VITE_AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}`,
    redirectUri: window.location.origin, // Will be http://localhost:5173 in development
    postLogoutRedirectUri: window.location.origin,
    knownAuthorities: [`${import.meta.env.VITE_AUTH_MICROSOFT_ENTRA_ID_TENANT_SUB_DOMAIN}.ciamlogin.com`],
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email'],
  prompt: 'select_account'
};

// Scopes for accessing the game service API
export const gameServiceRequest: PopupRequest = {
  scopes: ['api://ea73f4fc-76b6-4ddf-b629-4715d6513ef0/GameService.Access'],
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
