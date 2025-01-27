import { AuthenticatedTemplate } from '@azure/msal-react';

import { NavigationBar } from './NavigationBar.jsx';

export const PageLayout = (props) => {
    /**
     * Most applications will need to conditionally render certain components based on whether a user is signed in or not.
     * msal-react provides 2 easy ways to do this. AuthenticatedTemplate and UnauthenticatedTemplate components will
     * only render their children if a user is authenticated or unauthenticated, respectively.
     */
    return (
        <>
            <NavigationBar />
            <br />
            {props.children}
            <br />
            <AuthenticatedTemplate>
                <footer>
                    <center>
                        <a
                            href="http://github.com/dkirby-ms/webmud"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {' '}
                            Contribute
                        </a>
                    </center>
                </footer>
            </AuthenticatedTemplate>
        </>
    );
}