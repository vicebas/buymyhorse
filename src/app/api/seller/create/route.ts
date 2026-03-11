import prisma from "@/lib/db/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { NextResponse } from "next/server"

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  const existing = await prisma.sellerProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  if (existing) {
    return NextResponse.json({ error: "Seller profile already exists" }, { status: 400 })
  }

  const slug = slugify(body.displayName)

  const seller = await prisma.sellerProfile.create({
    data: {
      userId: session.user.id,
      displayName: body.displayName,
      slug,
      bio: body.bio,
      location: body.location,
      website: body.website,
    },
  })

  return NextResponse.json(seller)
}