import { config } from "dotenv";
config(); // load .env file
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { createLogger, format, transports } from "winston";
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from "axios";

export const logger = createLogger({
  level: "info",
  format: format.json(),
  transports: [
    //new transports.Console(),
    new transports.File({ filename: 'server.log' })
  ]
});

const ajv = new Ajv.default({
  useDefaults: true,
});

addFormats.default(ajv);

export { ajv };

const { data } = await axios.get(
  process.env.AUTH_ENTRA_ID_OPENID_CONFIG || "http://jwt.ms/"
);

const client = jwksClient({
  jwksUri: data.jwks_uri
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  client.getSigningKey(header.kid as string, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Function to validate a JWT issued by the Azure AD B2C tenant
export function validateJwt(token: string): Promise<jwt.JwtPayload | string | any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      { 
        algorithms: ["RS256"],
        audience: process.env.AUTH_ENTRA_ID_AUDIENCE,
        issuer: data.issuer
      } as jwt.VerifyOptions,
      (error, decoded) => {
        if (error) return reject(error);
        
        const payload = decoded as jwt.JwtPayload;
        
        // Validate that the token contains the required scope
        const requiredScope = process.env.AUTH_ENTRA_ID_SCOPE;
        if (requiredScope) {
          const scopeClaim = payload.scp || payload.scope;
          if (scopeClaim) {
            const scopes = typeof scopeClaim === 'string' ? scopeClaim.split(' ') : scopeClaim;
            const requiredScopeName = requiredScope.split('/').pop();
            if (!scopes.includes(requiredScopeName)) {
              return reject(new Error('Token does not contain required scope'));
            }
          } else {
            return reject(new Error('Token does not contain scope information'));
          }
        }
        
        resolve(payload);
      }
    );
  });
}

export function getOppositeDirection(direction: string): string {
  const oppositeDirections: Record<string, string> = {
    north: "the south",
    south: "the north",
    east: "the west",
    west: "the east",
    up: "the below",
    down: "above",
  };
  return oppositeDirections[direction] || direction;
}