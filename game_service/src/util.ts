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
      { algorithms: ["RS256"] } as jwt.VerifyOptions,
      (error, decoded) => {
        if (error) return reject(error);
        resolve(decoded as jwt.JwtPayload | string);
      }
    );
  });
}