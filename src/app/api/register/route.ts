import prisma from "@/lib/db/prisma"
import bcrypt from "bcrypt"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
    },
  })

  return NextResponse.json(user)
}