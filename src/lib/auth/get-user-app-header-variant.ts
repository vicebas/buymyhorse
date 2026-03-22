import prisma from "@/lib/db/prisma";

export async function getUserAppHeaderVariant(userId?: string | null) {
  if (!userId) {
    return "buyer" as const;
  }


  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  return sellerProfile ? ("seller" as const) : ("buyer" as const);
}
