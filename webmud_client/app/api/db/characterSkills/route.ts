import { auth } from "../../../../auth.ts"
import { MongoClient } from "mongodb";
import { NextResponse, NextRequest } from 'next/server.js'
 
//export const dynamic = 'force-static' // cache the response
//export const dynamic = 'force-dynamic' // don't cache the response
//export const dynamic = 'static' // use default caching behavior

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const authSession = await auth();
  if (authSession) {
    const client = new MongoClient(process.env.MONGODB_ADDRESS as string);
    try { 
      await client.connect();
      const db = client.db(process.env.MONGODB_NAME as string);
      const species = await db.collection("characterSkills").find({}).toArray();
      return NextResponse.json(species);
    } 

    catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      await client.close();
    }
  }

  return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
}
