import prisma from "@/lib/db/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!seller) {
    return NextResponse.json({ error: "Seller profile missing" }, { status: 400 })
  }

  const body = await req.json()

  const horse = await prisma.horse.create({
    data: {
      name: body.name,
      breed: body.breed,
      age: body.age,
      price: body.price,
      sellerProfileId: seller.id,
    },
  })

  return NextResponse.json(horse)
}