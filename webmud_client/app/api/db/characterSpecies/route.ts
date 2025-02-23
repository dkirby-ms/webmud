import { auth } from "auth"
import { MongoClient } from "mongodb";
import { NextResponse } from "next/server"
 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const authSession = await auth();
  if (authSession) {
    const client = new MongoClient(process.env.MONGODB_ADDRESS as string);
    try {
      await client.connect();
      const db = client.db(process.env.MONGODB_NAME as string);
      const species = await db.collection("characterSpecies").find({}).toArray();
      return NextResponse.json(species);
    } catch {
      return NextResponse.json({ error: "Failed to fetch species" }, { status: 500 });
    } finally {
      await client.close();
    }
  }

  return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
}
