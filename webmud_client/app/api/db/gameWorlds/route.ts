import { auth } from "../../../../auth.ts"
import { NextResponse, NextRequest } from "next/server.js"
import { gameServiceApi } from "../../../../lib/gameServiceApi.ts"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const authSession = await auth();
  if (authSession) {
    try {
      const worlds = await gameServiceApi.fetchGameWorlds();
      return NextResponse.json(worlds);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
}
