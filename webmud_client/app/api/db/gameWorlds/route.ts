import { auth } from "../../../../auth.ts"
import { MongoClient } from "mongodb";
import { NextResponse, NextRequest } from "next/server.js"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const authSession = await auth();
  if (authSession) {
    const client = new MongoClient(process.env.MONGODB_ADDRESS as string);
    await client.connect();
    const db = client.db(process.env.MONGODB_NAME as string);
    const worlds = await db.collection("worlds").find({ "properties.is_active": true }).toArray();
    return NextResponse.json(worlds);
  }

  return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
}
