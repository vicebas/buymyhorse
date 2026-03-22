import prisma from "@/lib/db/prisma"

export async function toggleBarnFollow(
  userId: string,
  sellerProfileId: string
): Promise<{ isFollowing: boolean }> {
  const existing = await prisma.barnFollow.findUnique({
    where: { userId_sellerProfileId: { userId, sellerProfileId } },
  })

  if (existing) {
    await prisma.barnFollow.delete({ where: { id: existing.id } })
    return { isFollowing: false }
  }

  await prisma.barnFollow.create({ data: { userId, sellerProfileId } })
  return { isFollowing: true }
}

export async function getBarnFollowStatus(
  userId: string,
  sellerProfileId: string
): Promise<boolean> {
  const follow = await prisma.barnFollow.findUnique({
    where: { userId_sellerProfileId: { userId, sellerProfileId } },
  })
  return !!follow
}

export async function getBarnFollowers(
  sellerProfileId: string
): Promise<Array<{ userId: string; email: string | null; name: string | null }>> {
  const follows = await prisma.barnFollow.findMany({
    where: { sellerProfileId },
    select: {
      user: { select: { id: true, email: true, name: true } },
    },
  })
  return follows.map((f) => ({
    userId: f.user.id,
    email: f.user.email,
    name: f.user.name,
  }))
}
