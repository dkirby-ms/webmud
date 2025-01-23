require('dotenv').config();

const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const session = require('express-session');

const app = express();

app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: false
}));

passport.use(new OIDCStrategy(
  {
    identityMetadata: `https://${process.env.AZURE_B2C_TENANT_NAME}.b2clogin.com/${process.env.AZURE_B2C_TENANT_NAME}.onmicrosoft.com/${process.env.AZURE_B2C_USER_FLOW}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.AZURE_CLIENT_ID,
    responseType: 'code',
    responseMode: 'query',
    redirectUrl: 'http://localhost:3005/auth/callback',
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    allowHttpForRedirectUrl: true
  },
  (iss, sub, profile, accessToken, refreshToken, done) => {
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(passport.initialize());

app.get('/login', passport.authenticate('azuread-openidconnect'));

app.get('/auth/callback', 
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
  (req, res) => {
    res.send('Successfully logged in!');
  }
);

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});