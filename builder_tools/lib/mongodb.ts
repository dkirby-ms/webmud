import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI; // game-service connection URI
if (!uri) throw new Error("Please define the MONGO_URI environment variable");

let client;
let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db("game-service");
  return { db, client };
}
