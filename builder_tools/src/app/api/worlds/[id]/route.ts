import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('game-service');
    const world = await db.collection('worlds').findOne({
      _id: new ObjectId(id)
    });
    
    if (!world) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(world);
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to fetch world' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('game-service');
    
    const updatedWorld = {
      ...body,
      updated: new Date()
    };
    
    const result = await db.collection('worlds').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedWorld }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedWorld);
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to update world' },
      { status: 500 }
    );
  }
}
