import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import prisma from "@/lib/db/prisma"
import { toggleBarnFollow, getBarnFollowStatus } from "@/server/follows"

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ isFollowing: false })
  }
  const { slug } = await params
  const seller = await prisma.sellerProfile.findUnique({ where: { slug }, select: { id: true } })
  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const isFollowing = await getBarnFollowStatus(session.user.id, seller.id)
  return NextResponse.json({ isFollowing })
}

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { slug } = await params
  const seller = await prisma.sellerProfile.findUnique({ where: { slug }, select: { id: true } })
  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const result = await toggleBarnFollow(session.user.id, seller.id)
  return NextResponse.json(result)
}
