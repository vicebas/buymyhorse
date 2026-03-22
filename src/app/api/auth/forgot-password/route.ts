import { NextResponse } from "next/server"
import { z } from "zod"

import { createPasswordResetToken } from "@/lib/auth/tokens"
import { sendPasswordResetEmail } from "@/lib/email/mailer"
import prisma from "@/lib/db/prisma"

const schema = z.object({
  email: z.email(),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)

  // Always return 200 to prevent email enumeration
  if (!parsed.success) {
    return NextResponse.json({ ok: true })
  }

  const email = parsed.data.email.toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, password: true },
  })

  // Only send if the user exists and has a password (credentials-based account)
  if (user?.password) {
    const token = await createPasswordResetToken(user.id)

    sendPasswordResetEmail({
      toName: user.name ?? "there",
      toEmail: email,
      token,
    }).catch((err) => console.error("[forgot-password] email error:", err))
  }

  return NextResponse.json({ ok: true })
}
