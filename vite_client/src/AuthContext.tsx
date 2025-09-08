import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import type { 
  AuthenticationResult, 
  AccountInfo,
  SilentRequest
} from '@azure/msal-browser';
import { msalConfig, loginRequest } from './authConfig';

interface AuthContextType {
  instance: PublicClientApplication;
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        
        // Handle redirect response if coming back from authentication
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          handleAuthenticationResult(response);
        }

        // Check if user is already signed in
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          setUser(accounts[0]);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMsal();
  }, []);

  const handleAuthenticationResult = (result: AuthenticationResult) => {
    if (result.account) {
      setUser(result.account);
      setIsAuthenticated(true);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const response = await msalInstance.loginPopup(loginRequest);
      handleAuthenticationResult(response);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await msalInstance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
      });
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (!user) return null;

    const request: SilentRequest = {
      scopes: loginRequest.scopes || [],
      account: user,
    };

    try {
      const response = await msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire token silently:', error);
      
      // If silent token acquisition fails, try popup
      try {
        const response = await msalInstance.acquireTokenPopup(request);
        return response.accessToken;
      } catch (popupError) {
        console.error('Failed to acquire token via popup:', popupError);
        return null;
      }
    }
  };

  const value: AuthContextType = {
    instance: msalInstance,
    isAuthenticated,
    user,
    login,
    logout,
    getAccessToken,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
