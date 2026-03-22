import prisma from "@/lib/db/prisma";

export type SellerNotificationSummary = {
  unreadMessageCount: number;
  pendingRequestCount: number;
};

export async function getSellerNotificationSummary(
  userId: string
): Promise<SellerNotificationSummary> {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!seller) {
    return {
      unreadMessageCount: 0,
      pendingRequestCount: 0,
    };
  }

  const [pendingRequestCount, conversations] = await Promise.all([
    prisma.accessRequest.count({
      where: {
        status: "PENDING",
        horse: {
          sellerProfileId: seller.id,
        },
      },
    }),
    prisma.horseConversation.findMany({
      where: {
        sellerId: seller.id,
      },
      select: {
        id: true,
        sellerLastReadAt: true,
        messages: {
          where: {
            senderUserId: {
              not: seller.userId,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const unreadMessageCount = conversations.reduce((count, conversation) => {
    const latestBuyerMessage = conversation.messages[0];

    if (!latestBuyerMessage) {
      return count;
    }

    if (
      !conversation.sellerLastReadAt ||
      latestBuyerMessage.createdAt > conversation.sellerLastReadAt
    ) {
      return count + 1;
    }

    return count;
  }, 0);

  return {
    unreadMessageCount,
    pendingRequestCount,
  };
}

export async function markSellerConversationRead(
  conversationId: string,
  sellerId: string
) {
  return prisma.horseConversation.updateMany({
    where: {
      id: conversationId,
      sellerId,
    },
    data: {
      sellerLastReadAt: new Date(),
    },
  });
}

export async function markBuyerConversationRead(
  conversationId: string,
  buyerId: string
) {
  return prisma.horseConversation.updateMany({
    where: {
      id: conversationId,
      buyerId,
    },
    data: {
      buyerLastReadAt: new Date(),
    },
  });
}
