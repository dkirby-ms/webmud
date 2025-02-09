import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filter: any = {};
  const q = searchParams.get("q");
  if(q) filter.name = { $regex: new RegExp(q, "i") };
  const { db } = await connectToDatabase();
  const items = await db.collection("worlds").find(filter).toArray();
  return NextResponse.json({ data: items });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { db } = await connectToDatabase();
  const result = await db.collection("worlds").insertOne(body);
  return NextResponse.json({ insertedId: result.insertedId });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  const { db } = await connectToDatabase();
  await db.collection("worlds").updateOne({ _id: new ObjectId(id) }, { $set: data });
  return NextResponse.json({ updated: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { db } = await connectToDatabase();
  await db.collection("worlds").deleteOne({ _id: new ObjectId(id!) });
  return NextResponse.json({ deleted: true });
}
