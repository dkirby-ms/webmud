import { auth } from "../../../../auth.ts"
import { NextResponse, NextRequest } from 'next/server.js'
import { gameServiceApi } from "../../../../lib/gameServiceApi.ts"
 
//export const dynamic = 'force-static' // cache the response
//export const dynamic = 'force-dynamic' // don't cache the response
//export const dynamic = 'static' // use default caching behavior

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const authSession = await auth();
  if (authSession) {
    try {
      const skills = await gameServiceApi.fetchCharacterSkills();
      return NextResponse.json(skills);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
}
