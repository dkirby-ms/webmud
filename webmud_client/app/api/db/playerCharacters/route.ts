import { type NextRequest } from 'next/server';
import { MongoClient } from "mongodb";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  //const searchParams = request.nextUrl.searchParams
  //const userId = searchParams.get('userId')
  const session = await auth() as any;
  const userId = session.userId;
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });
  
  
  const client = new MongoClient(process.env.MONGODB_ADDRESS as string);
  await client.connect();

  const db = client.db(process.env.MONGODB_NAME as string);
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
    { $project: { speciesData: 0 } }
  ]).toArray();
    
  return Response.json(characters);
};

