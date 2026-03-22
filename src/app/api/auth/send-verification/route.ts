import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth/options"
import { createEmailVerificationToken } from "@/lib/auth/tokens"
import { sendVerificationEmail } from "@/lib/email/mailer"
import prisma from "@/lib/db/prisma"

// Rate-limit: one send per 60 seconds per user (stored in a simple in-memory map)
const lastSentAt = new Map<string, number>()

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const now = Date.now()
  const last = lastSentAt.get(userId) ?? 0
  if (now - last < 60_000) {
    return NextResponse.json(
      { error: "Please wait before requesting another verification email." },
      { status: 429 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, emailVerified: true },
  })

  if (!user?.email) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "Email is already verified." }, { status: 400 })
  }

  const token = await createEmailVerificationToken(user.email)

  // Fire-and-forget — don't block the response on email delivery
  sendVerificationEmail({
    toName: user.name ?? "there",
    toEmail: user.email,
    token,
  }).catch((err) => console.error("[send-verification] email error:", err))

  lastSentAt.set(userId, now)

  return NextResponse.json({ ok: true })
}
