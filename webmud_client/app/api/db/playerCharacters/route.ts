import { type NextRequest, NextResponse } from 'next/server.js';
import { MongoClient } from "mongodb";
import { auth } from "../../../../auth.ts"

export async function GET() {
  const session = await auth() as any;
  const userId = session.userId;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  
  
  const client = new MongoClient(process.env.MONGODB_URI as string);
  await client.connect();

  const db = client.db(process.env.MONGODB_NAME as string);
  try {
    const characters = await db.collection("playerCharacters").aggregate([
      { $match: { userId: userId } },
      { $lookup: {
        from: "characterSpecies",
        localField: "species",
        foreignField: "_id",
        as: "speciesData"
      }},
      { $unwind: "$speciesData" },
      { $addFields: { speciesName: "$speciesData.name" } },
      { $project: { speciesData: 0 } },
      { $lookup: {
        from: "worlds",
        let: { worldId: "$worldId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$worldId" }] } } }
        ],
        as: "worldData"
      }},
      { $unwind: "$worldData" },
      { $addFields: { worldName: "$worldData.name", worldUrl: "$worldData.url" } },
      { $project: { worldData: 0 } }
    ]).toArray();
    return NextResponse.json(characters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
};

export async function POST(request: NextRequest) {
  const session = await auth() as any;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const data = await request.json();

  const client = new MongoClient(process.env.MONGODB_URI as string);
  await client.connect();
  const db = client.db(process.env.MONGODB_NAME as string);

  try {
    const result = await db.collection("playerCharacters").insertOne(data);
    return NextResponse.json({ insertedId: result.insertedId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
