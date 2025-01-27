import { MsalProvider, AuthenticatedTemplate, useMsal, UnauthenticatedTemplate } from '@azure/msal-react';
import { Container, Button } from 'react-bootstrap';
import { PageLayout } from './components/PageLayout';
import { IdTokenData } from './components/DataDisplayIDToken';
import { WebSocketConsole } from './components/WebSocketConsole';
import { loginRequest } from './authConfig';
import React from 'react';
import ReactDOM from 'react-dom';
import { useEffect, useState } from 'react';
import './styles/App.css';

/**
 * Most applications will need to conditionally render certain components based on whether a user is signed in or not. 
 * msal-react provides 2 easy ways to do this. AuthenticatedTemplate and UnauthenticatedTemplate components will 
 * only render their children if a user is authenticated or unauthenticated, respectively. For more, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md
 */
const MainContent = () => {
    /**
     * useMsal is hook that returns the PublicClientApplication instance,
     * that tells you what msal is currently doing. For more, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md
     */
    const { instance } = useMsal();
    const activeAccount = instance.getActiveAccount();

    useEffect(() => {
        if (activeAccount) {
            instance.acquireTokenSilent({
                ...loginRequest,
                account: activeAccount,
            }).then((response) => {
                console.log('Silent token acquisition successful:', response);
                userServiceLogin(response.accessToken);
            }).catch((error) => {
                console.error('Error acquiring token:', error);
            });
        }
    }, [activeAccount, instance]);

    const userServiceLogin = (token) => {
        fetch('http://localhost:28998/loginUser', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ accessToken: token })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Service response:', data);
        })
        .catch(error => {
            console.error('Error calling service:', error);
        });
    };

    const handleRedirect = () => {
        instance
            .loginRedirect({
                ...loginRequest,
                prompt: 'create',
            })
            .catch((error) => console.log(error));
    };

    const handleLogout = () => {
        instance.logoutRedirect().catch((error) => console.log(error));
    };

    return (
        <div className="App">
            <AuthenticatedTemplate>
                {activeAccount ? (
                    <Container>
                        <h3>Welcome, {activeAccount?.username}</h3>  
                        <WebSocketConsole url={"http://localhost:28999"} />
                        <Button className="signOutButton" onClick={handleLogout} variant="secondary">
                            Logout
                        </Button>
                        <IdTokenData idTokenClaims={activeAccount.idTokenClaims} />
                    </Container>
                ) : null}
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <Button className="signInButton" onClick={handleRedirect} variant="primary">
                    Login
                </Button>
            </UnauthenticatedTemplate>
        </div>
    );
};


/**
 * msal-react is built on the React context API and all parts of your app that require authentication must be 
 * wrapped in the MsalProvider component. You will first need to initialize an instance of PublicClientApplication 
 * then pass this to MsalProvider as a prop. All components underneath MsalProvider will have access to the 
 * PublicClientApplication instance via context as well as all hooks and components provided by msal-react. For more, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md
 */
const App = ({ instance }) => {
    return (
        <MsalProvider instance={instance}>
            <PageLayout>
                <MainContent />
            </PageLayout>
        </MsalProvider>
    );
};

export default App;