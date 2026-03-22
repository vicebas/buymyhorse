import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcrypt"

import { consumePasswordResetToken } from "@/lib/auth/tokens"
import prisma from "@/lib/db/prisma"

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid request." },
      { status: 400 }
    )
  }

  const userId = await consumePasswordResetToken(parsed.data.token)

  if (!userId) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    )
  }

  const hash = await bcrypt.hash(parsed.data.password, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hash },
  })

  return NextResponse.json({ ok: true })
}
