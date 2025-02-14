//// filepath: /home/saitcho/webmud/game-service/src/db/client.ts
import { MongoClient, Db } from "mongodb";

const MONGODB_NAME = process.env.MONGODB_NAME || "game-service";

export const MONGO_SOCKET_ADAPTER_COLLECTION =
  process.env.MONGO_SOCKET_ADAPTER_COLLECTION || "socket.io-adapter";

export async function createDbClient(mongoUrl: string): Promise<{ client: MongoClient; db: Db }> {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  const db = client.db(MONGODB_NAME);
  return { client, db };
}