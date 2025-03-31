import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('game-service');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const worldId = searchParams.get('worldId');

  const rooms = await db.collection('rooms')
    .find({ worldId: worldId })
    .toArray();

  return NextResponse.json(rooms);
}

export async function POST(request: Request) {
  const room = await request.json();
  const result = await db.collection('rooms').insertOne(room);
  return NextResponse.json({ _id: result.insertedId });
}

export async function PUT(request: Request) {
  const room = await request.json();
  const { _id, ...updateData } = room;
  
  await db.collection('rooms').updateOne(
    { _id: new ObjectId(_id) },
    { $set: updateData }
  );

  return NextResponse.json({ success: true });
}
