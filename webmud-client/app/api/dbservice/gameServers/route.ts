import { auth } from "auth"

export const GET = auth((req) => {
  if (req.auth) {
    return Response.json([{ id: "dev1", name: "Dev server", uri: "http://localhost:28999" }])
  }

  return Response.json({ message: "Not authenticated" }, { status: 401 })
}) as any // TODO: Fix `auth()` return type
