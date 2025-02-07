import session from "express-session";
import AADB2C from "@auth/express/providers/azure-ad-b2c"
import { ExpressAuth } from "@auth/express"
import MongoStore from 'connect-mongo'
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from "../util.js";

const _30_DAYS = 30 * 24 * 60 * 60 * 1000;
const OPENID_CONFIG = process.env.AUTH_AZURE_AD_OPENID_CONFIG || "https://agora9.b2clogin.com/agora9.onmicrosoft.com/B2C_1_signupsignin/v2.0/.well-known/openid-configuration"
const B2C_PUBLIC_KEY = `-----BEGIN RSA PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtVKUtcx/n9rt5afY/2WF
NvU6PlFMggCatsZ3l4RjKxH0jgdLq6CScb0P3ZGXYbPzXvmmLiWZizpb+h0qup5j
znOvOr+Dhw9908584BSgC83YacjWNqEK3urxhyE2jWjwRm2N95WGgb5mzE5XmZIv
kvyXnn7X8dvgFPF5QwIngGsDG8LyHuJWlaDhr/EPLMW4wHvH0zZCuRMARIJmmqiM
y3VD4ftq4nS5s8vJL0pVSrkuNojtokp84AtkADCDU/BUhrc2sIgfnvZ03koCQRoZ
mWiHu86SuJZYkDFstVTVSR0hiXudFlfQ2rOhPlpObmku68lXw+7V+P7jwrQRFfQV
XwIDAQAB
-----END RSA PUBLIC KEY-----`;

export function initAuth({ app, io, db, config }) {
  // setup auth middleware
  app.set("trust proxy", true);
  app.use("/auth/*", ExpressAuth({ providers: [ AADB2C ] }));

  setupSession({ app, io, db, config });

  io.use(async (socket, next) => {
      // verify access token
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error - access token not found"));
      }
  
      try {
        const payload = validateJwt(token);
        socket.userId = payload.userId;
        next();
      } catch (e) {
        next(new Error("Authentication error - invalid access token"));
      }
      // register user as connected
      logger.info(`User ${socket.userId} connected`);
    });

}

// need to fix this hardcoded connection string and pull from same mongodb used by logger
function setupSession({ app, io, db, config }) {
  const sessionMiddleware = session({
    name: "sid",
    secret: config.sessionSecrets,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: _30_DAYS,
      sameSite: "lax",
    },
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/game-service' })
  });

  app.use(sessionMiddleware);
  io.engine.use(sessionMiddleware);
}

// Function to validate a JWT issued by the Azure AD B2C tenant
function validateJwt(token) {
  // Create a JWKS client using the JWKS URI from the OpenID configuration
  // const client = jwksClient({
  //   jwksUri: OPENID_CONFIG
  // });

  // Decode the token to extract the header and its key id (kid)
  const decodedToken = jwt.decode(token, { complete: true });
  if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
    throw new Error("Invalid token");
  }

  // Verify and return the decoded token payload
  return jwt.verify(token, B2C_PUBLIC_KEY);
}
