import { type NextRequest, NextResponse } from 'next/server.js';
import { auth } from "../../../../auth.ts"
import { gameServiceApi } from "../../../../lib/gameServiceApi.ts"

export async function GET() {
  const session = await auth() as any;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.userId;
  
  try {
    const characters = await gameServiceApi.fetchPlayerCharacters(userId);
    return NextResponse.json(characters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export async function POST(request: NextRequest) {
  const session = await auth() as any;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const data = await request.json();

  try {
    const result = await gameServiceApi.createPlayerCharacter(data);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
