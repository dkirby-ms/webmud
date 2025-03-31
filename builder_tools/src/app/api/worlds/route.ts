import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import type { World } from '@/types/database';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(MONGODB_URI);
const db = client.db('game-service');

function isValidWorldInput(input: any): input is { name: string; description: string } {
  return typeof input === 'object' 
    && typeof input.name === 'string' 
    && input.name.length > 0 
    && typeof input.description === 'string';
}

export async function GET() {
  try {
    await client.connect();
    const worlds = await db.collection<World>('worlds').find().toArray();
    return NextResponse.json(worlds);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch worlds' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!isValidWorldInput(body)) {
      return NextResponse.json(
        { error: 'Invalid world data' },
        { status: 400 }
      );
    }
    
    const newWorld: Omit<World, '_id'> = {
      name: body.name,
      description: body.description,
      created: new Date(),
      updated: new Date()
    };

    await client.connect();
    const result = await db.collection<World>('worlds').insertOne(newWorld as World);
    
    const created: World = {
      _id: result.insertedId.toString(),
      ...newWorld
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create world' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
