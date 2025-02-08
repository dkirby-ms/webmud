import Ajv from "ajv";
import addFormats from "ajv-formats";
import { createLogger, format, transports } from "winston";

export const logger = createLogger({
  level: "info",
  format: format.json(),
  transports: [
    //new transports.Console(),
    new transports.File({ filename: 'logfile.log' })
  ]
});

const ajv = new Ajv({
  useDefaults: true,
});

addFormats(ajv);

export { ajv };

// export async function doInTransaction(pool, query) {
//   const client = await pool.connect();
//   let output;

//   try {
//     await client.query("BEGIN");

//     output = await query(client);

//     await client.query("COMMIT");
//   } catch (e) {
//     await client.query("ROLLBACK");
//     throw e;
//   } finally {
//     client.release();
//   }

//   return output;
// }

export function channelRoom(channelId) {
  return `channel:${channelId}`;
}

export function userRoom(userId) {
  return `user:${userId}`;
}

export function sessionRoom(sessionId) {
  return `session:${sessionId}`;
}

export function userStateRoom(userId) {
  return `user_state:${userId}`;
}
