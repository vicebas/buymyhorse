import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { markNotificationsRead, markAllNotificationsRead } from "@/server/notifications"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  if (Array.isArray(body?.ids) && body.ids.length > 0) {
    await markNotificationsRead(session.user.id, body.ids)
  } else {
    await markAllNotificationsRead(session.user.id)
  }
  return NextResponse.json({ ok: true })
}
