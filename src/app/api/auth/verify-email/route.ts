import { NextResponse } from "next/server"
import { z } from "zod"

import { consumeEmailVerificationToken } from "@/lib/auth/tokens"
import prisma from "@/lib/db/prisma"

const schema = z.object({
  token: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const email = await consumeEmailVerificationToken(parsed.data.token)

  if (!email) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired." },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}
