import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('game-service');
    const worlds = await db.collection('worlds').find({}).toArray();
    
    return NextResponse.json(worlds);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch worlds' }, { status: 500 });
  }
}
