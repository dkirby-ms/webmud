import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_NAME || 'your-db-name';

let client: MongoClient;
let db: Db;

/**
 * Connects to MongoDB and returns the client and database objects.
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
    if (db) {
        // Reuse existing connection if available
        return { client, db };
    }

    client = await MongoClient.connect(uri);
    db = client.db(dbName);
    return { client, db };
}