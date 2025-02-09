import AADB2C from "@auth/express/providers/azure-ad-b2c"
import { ExpressAuth } from "@auth/express"
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from "../util.js";

const OPENID_CONFIG = process.env.AUTH_AZURE_AD_OPENID_CONFIG || "https://agora9.b2clogin.com/agora9.onmicrosoft.com/B2C_1_signupsignin/v2.0/.well-known/openid-configuration"
const B2C_PUBLIC_KEY = `{"kid":"X5eXk4xyojNFum1kl2Ytv8dlNP4-c57dO6QGTVBwaNk","nbf":1493763266,"use":"sig","kty":"RSA","e":"AQAB","n":"tVKUtcx_n9rt5afY_2WFNvU6PlFMggCatsZ3l4RjKxH0jgdLq6CScb0P3ZGXYbPzXvmmLiWZizpb-h0qup5jznOvOr-Dhw9908584BSgC83YacjWNqEK3urxhyE2jWjwRm2N95WGgb5mzE5XmZIvkvyXnn7X8dvgFPF5QwIngGsDG8LyHuJWlaDhr_EPLMW4wHvH0zZCuRMARIJmmqiMy3VD4ftq4nS5s8vJL0pVSrkuNojtokp84AtkADCDU_BUhrc2sIgfnvZ03koCQRoZmWiHu86SuJZYkDFstVTVSR0hiXudFlfQ2rOhPlpObmku68lXw-7V-P7jwrQRFfQVXw"}`;
const client = jwksClient({
  jwksUri: 'https://agora9.b2clogin.com/agora9.onmicrosoft.com/b2c_1_signupsignin/discovery/v2.0/keys'
});

export function initAuth({ app, io, db, config }) {
  // setup auth middleware
  app.set("trust proxy", true);
  app.use("/auth/*", ExpressAuth({ providers: [ AADB2C ] }));

  // on each socket connection, verify the access token signature and register the user as connected.
  io.use(async (socket, next) => {
      // verify access token
      const token = socket.handshake.auth.token;
      const session = socket.request.session;
      if (!token) {
        return next(new Error("Authentication error - access token not found"));
      }
      try {
        const payload = await validateJwt(token);
        session.userId = payload.sub;
        socket.userId = payload.sub;
        session.userFriendlyName = payload.name
        next();
      } catch (e) {
        next(new Error("Authentication error - invalid access token"));
      }
      
      logger.debug(`${socket.client.id} connected from ${socket.handshake.address} `);
      next();
    });
}

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Function to validate a JWT issued by the Azure AD B2C tenant
export function validateJwt(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (error, decoded) => {
      if (error) return reject(error);
      resolve(decoded);
    });
  });
}
