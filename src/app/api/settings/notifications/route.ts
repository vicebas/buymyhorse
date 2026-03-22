import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { getOrCreatePreferences, updatePreferences } from "@/server/notification-preferences"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const prefs = await getOrCreatePreferences(session.user.id)
  return NextResponse.json(prefs)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  // Only allow known preference keys
  const allowed = [
    "systemNewHorseFromFollowedBarn",
    "systemHorseUpdatedFromFollowedBarn",
    "systemNewMessage",
    "emailNewHorseFromFollowedBarn",
    "emailHorseUpdatedFromFollowedBarn",
    "emailNewMessage",
  ] as const
  const updates: Partial<Record<(typeof allowed)[number], boolean>> = {}
  for (const key of allowed) {
    if (typeof body[key] === "boolean") {
      updates[key] = body[key]
    }
  }
  const prefs = await updatePreferences(session.user.id, updates)
  return NextResponse.json(prefs)
}
