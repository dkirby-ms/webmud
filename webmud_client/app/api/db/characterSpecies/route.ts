import { auth } from "auth"
import { MongoClient } from "mongodb";

export const GET = auth(async (req) => {
  if (req.auth) {
    const client = new MongoClient(process.env.MONGODB_ADDRESS as string);
    try {
      await client.connect();
      const db = client.db(process.env.MONGODB_NAME as string);
      const species = await db.collection("characterSpecies").find({}).toArray();
      return Response.json(species);
    } catch {
      return Response.json({ error: "Failed to fetch species" }, { status: 500 });
    } finally {
      await client.close();
    }
  }

  return Response.json({ message: "Not authenticated" }, { status: 401 })
})
