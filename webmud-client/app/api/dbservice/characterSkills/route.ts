import { auth } from "auth"
import { MongoClient } from "mongodb";

export const GET = auth(async (req) => {
  if (req.auth) {
    const client = new MongoClient(process.env.MONGODB_ADDRESS as string);
    await client.connect();
    const db = client.db(process.env.MONGODB_NAME as string);
    const species = await db.collection("characterSkills").find({}).toArray();
    return Response.json(species);
  }

  return Response.json({ message: "Not authenticated" }, { status: 401 })
}) as any // TODO: Fix `auth()` return type
