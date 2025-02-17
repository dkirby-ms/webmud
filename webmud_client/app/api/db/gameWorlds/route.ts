import { auth } from "auth"
import { MongoClient } from "mongodb";

export const GET = auth(async (req) => {
  if (req.auth) {
    const client = new MongoClient(process.env.MONGODB_ADDRESS as string);
    await client.connect();
    const db = client.db(process.env.MONGODB_NAME as string);
    const worlds = await db.collection("worlds").find({ "properties.is_active": true }).toArray();
    return Response.json(worlds);
  }

  return Response.json({ message: "Not authenticated" }, { status: 401 })
}) as any
