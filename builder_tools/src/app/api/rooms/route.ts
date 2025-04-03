import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { auth } from '../../../../auth';
const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('game-service');

export async function GET(request: Request) {
  const authSession = await auth();
  if (authSession) {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get('worldId');

    const rooms = await db.collection('rooms')
      .find({ worldId: worldId })
      .toArray();

    return NextResponse.json(rooms);
  }
  else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const authSession = await auth();
  if (authSession) {
    const room = await request.json();
    const result = await db.collection('rooms').insertOne(room);
    return NextResponse.json({ _id: result.insertedId });
  }
  else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  const authSession = await auth();
  if (!authSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const room = await request.json();
  const { _id, ...updateData } = room;

  await db.collection('rooms').updateOne(
    { _id: new ObjectId(_id) },
    { $set: updateData }
  );

  return NextResponse.json({ success: true });
}
