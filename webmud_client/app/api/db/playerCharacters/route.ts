import { auth } from "auth"
import { MongoClient } from "mongodb";

export const GET = auth(async (req) => {
  if (req.auth) {
    const session = await auth() as any
    const client = new MongoClient(process.env.MONGODB_ADDRESS as string);
    await client.connect();

    const db = client.db(process.env.MONGODB_NAME as string);
    const characters = await db.collection("playerCharacters")
      .find({ userId: session.userId })
      .toArray();
    return Response.json(characters);
  }

  return Response.json({ message: "Not authenticated" }, { status: 401 })
}) as any
