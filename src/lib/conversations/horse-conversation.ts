import prisma from "@/lib/db/prisma";

export async function ensureHorseConversation(horseId: string, buyerId: string, sellerId: string) {
  const existingConversation = await prisma.horseConversation.findUnique({
    where: {
      horseId_buyerId: {
        horseId,
        buyerId,
      },
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  return prisma.horseConversation.create({
    data: {
      horseId,
      buyerId,
      sellerId,
    },
  });
}
