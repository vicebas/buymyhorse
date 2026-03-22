import prisma from "@/lib/db/prisma";

export type MessageInboxScope = "buyer" | "all";
export type MessageSummaryScope = "buyer" | "seller";

export type MessageInboxItem = {
  id: string;
  roleInConversation: "seller" | "buyer";
  horse: {
    id: string;
    name: string;
    image: string | null;
  };
  contextLabel: string;
  contextDescription: string;
  counterpartyLabel: string;
  counterpartyName: string;
  counterpartyDetail: string;
  lastMessagePreview: string;
  lastActivityAt: string;
  unread: boolean;
};

export type MessageNotificationSummary = {
  unreadMessageCount: number;
  pendingRequestCount: number;
};

type ConversationWithPreview = {
  id: string;
  sellerId: string;
  buyerId: string;
  sellerLastReadAt: Date | null;
  buyerLastReadAt: Date | null;
  createdAt: Date;
  horse: {
    id: string;
    name: string;
    image: string | null;
  };
  buyer: {
    id: string;
    name: string | null;
    email: string | null;
  };
  sellerProfile: {
    id: string;
    displayName: string;
    userId: string;
  };
  messages: Array<{
    id: string;
    body: string | null;
    messageType: "TEXT" | "GRANT";
    createdAt: Date;
    senderUserId: string;
  }>;
};

function getLastMessagePreview(message?: ConversationWithPreview["messages"][number]) {
  if (!message) {
    return "No messages yet";
  }

  return message.messageType === "GRANT"
    ? "Document access granted"
    : message.body || "No messages yet";
}

function isConversationUnread({
  conversation,
  roleInConversation,
  userId,
  sellerUserId,
}: {
  conversation: ConversationWithPreview;
  roleInConversation: "seller" | "buyer";
  userId: string;
  sellerUserId?: string;
}) {
  const latestMessage = conversation.messages[0];

  if (!latestMessage) {
    return false;
  }

  if (roleInConversation === "seller") {
    if (latestMessage.senderUserId === sellerUserId) {
      return false;
    }

    return (
      !conversation.sellerLastReadAt ||
      latestMessage.createdAt > conversation.sellerLastReadAt
    );
  }

  if (latestMessage.senderUserId === userId) {
    return false;
  }

  return (
    !conversation.buyerLastReadAt ||
    latestMessage.createdAt > conversation.buyerLastReadAt
  );
}

export async function getMessageInboxItems(
  userId: string,
  scope: MessageInboxScope,
  includeMutedBlocked = false
): Promise<MessageInboxItem[]> {
  const seller = await prisma.sellerProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  const where =
    scope === "all" && seller
      ? {
          OR: [{ sellerId: seller.id }, { buyerId: userId }],
        }
      : {
          buyerId: userId,
        };

  const conversations = (await prisma.horseConversation.findMany({
    where,
    select: {
      id: true,
      sellerId: true,
      buyerId: true,
      sellerLastReadAt: true,
      buyerLastReadAt: true,
      createdAt: true,
      horse: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      sellerProfile: {
        select: {
          id: true,
          displayName: true,
          userId: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          body: true,
          messageType: true,
          createdAt: true,
          senderUserId: true,
        },
      },
    },
  })) as ConversationWithPreview[];

  // If the current user is a seller and we should exclude muted/blocked, load the
  // seller's contact controls for the buyer ids and filter them out client-side.
  let contactControlMap: Record<string, { isMuted: boolean; isBlocked: boolean }> = {};

  if (seller && !includeMutedBlocked) {
    const buyerIds = conversations.map((c) => c.buyer.id);
    const controls = await prisma.sellerContactControl.findMany({
      where: {
        sellerProfileId: seller.id,
        targetUserId: { in: buyerIds },
      },
      select: {
        targetUserId: true,
        isMuted: true,
        isBlocked: true,
      },
    });

    contactControlMap = controls.reduce((acc, cur) => {
      acc[cur.targetUserId] = { isMuted: cur.isMuted, isBlocked: cur.isBlocked };
      return acc;
    }, {} as Record<string, { isMuted: boolean; isBlocked: boolean }>);
  }

  return conversations
    .map((conversation) => {
      const roleInConversation =
        seller && conversation.sellerId === seller.id ? ("seller" as const) : ("buyer" as const);
      // If seller and we are excluding muted/blocked, skip those conversations
      if (
        seller &&
        !includeMutedBlocked &&
        roleInConversation === "seller" &&
        contactControlMap[conversation.buyer.id] &&
        (contactControlMap[conversation.buyer.id].isMuted ||
          contactControlMap[conversation.buyer.id].isBlocked)
      ) {
        return null as unknown as MessageInboxItem;
      }
      const lastMessage = conversation.messages[0];
      const lastActivityAt = lastMessage?.createdAt ?? conversation.createdAt;
      const unread = isConversationUnread({
        conversation,
        roleInConversation,
        userId,
        sellerUserId: seller?.userId,
      });

      return {
        id: conversation.id,
        roleInConversation,
        horse: conversation.horse,
        contextLabel: roleInConversation === "seller" ? "Your horse" : "Sent inquiry",
        contextDescription:
          roleInConversation === "seller" ? "Incoming lead" : "Buyer-side conversation",
        counterpartyLabel: roleInConversation === "seller" ? "Buyer" : "Barn",
        counterpartyName:
          roleInConversation === "seller"
            ? conversation.buyer.name || conversation.buyer.email || "Unnamed buyer"
            : conversation.sellerProfile.displayName,
        counterpartyDetail:
          roleInConversation === "seller"
            ? conversation.buyer.email || "No buyer email"
            : conversation.sellerProfile.displayName,
        lastMessagePreview: getLastMessagePreview(lastMessage),
        lastActivityAt: lastActivityAt.toISOString(),
        unread,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
}

export async function getMessageNotificationSummary(
  userId: string,
  scope: MessageSummaryScope
): Promise<MessageNotificationSummary> {
  if (scope === "seller") {
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

  const conversations = await prisma.horseConversation.findMany({
    where: {
      buyerId: userId,
    },
    select: {
      id: true,
      buyerLastReadAt: true,
      messages: {
        where: {
          senderUserId: {
            not: userId,
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
  });

  const unreadMessageCount = conversations.reduce((count, conversation) => {
    const latestSellerMessage = conversation.messages[0];

    if (!latestSellerMessage) {
      return count;
    }

    if (
      !conversation.buyerLastReadAt ||
      latestSellerMessage.createdAt > conversation.buyerLastReadAt
    ) {
      return count + 1;
    }

    return count;
  }, 0);

  return {
    unreadMessageCount,
    pendingRequestCount: 0,
  };
}
