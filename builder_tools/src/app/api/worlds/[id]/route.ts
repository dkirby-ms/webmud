import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import type { World } from '@/types/database';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(MONGODB_URI);
const db = client.db('game-service');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams.id) {
      return NextResponse.json(
        { error: 'World ID is required' },
        { status: 400 }
      );
    }
    if (!ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: 'Invalid World ID' },
        { status: 400 }
      );
    }
    // Connect to the database
    await client.connect();
    const world = await db.collection<World>('worlds').findOne({
      _id: new ObjectId(resolvedParams.id)
    });

    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(world);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch world' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams.id) {
      return NextResponse.json(
        { error: 'World ID is required' },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: 'Invalid World ID' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'World name is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<World> = {
      name: body.name,
      description: body.description || '',
      updated: new Date()
    };

    // Connect to the database
    await client.connect();
    
    // Check if world exists
    const existingWorld = await db.collection<World>('worlds').findOne({
      _id: new ObjectId(resolvedParams.id)
    });
    
    if (!existingWorld) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    // Update the world
    const result = await db.collection<World>('worlds').updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes made to the world' },
        { status: 400 }
      );
    }

    // Get updated world
    const updatedWorld = await db.collection<World>('worlds').findOne({
      _id: new ObjectId(resolvedParams.id)
    });

    return NextResponse.json(updatedWorld);
  } catch (error) {
    console.error('Failed to update world:', error);
    return NextResponse.json(
      { error: 'Failed to update world' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
