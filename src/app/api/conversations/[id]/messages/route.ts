import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import {
  markBuyerConversationRead,
  markSellerConversationRead,
} from "@/lib/notifications/seller";

async function loadConversationForParticipant(id: string, userId: string) {
  const conversation = await prisma.horseConversation.findUnique({
    where: {
      id,
    },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
        },
      },
      sellerProfile: {
        select: {
          id: true,
          displayName: true,
          userId: true,
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  const isBuyer = conversation.buyer.id === userId;
  const isSeller = conversation.sellerProfile.userId === userId;

  if (!isBuyer && !isSeller) {
    return null;
  }

  return {
    conversation,
    isBuyer,
    isSeller,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await loadConversationForParticipant(id, session.user.id);

  if (!result) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (result.isSeller) {
    await markSellerConversationRead(result.conversation.id, result.conversation.sellerId);
  } else {
    await markBuyerConversationRead(result.conversation.id, result.conversation.buyerId);
  }

  return NextResponse.json({
    conversationId: result.conversation.id,
    roleInConversation: result.isSeller ? "seller" : "buyer",
    horseId: result.conversation.horse.id,
    horseName: result.conversation.horse.name,
    counterpartLabel: result.isSeller ? "Buyer" : "Barn",
    counterpartName: result.isSeller
      ? result.conversation.buyer.name || result.conversation.buyer.email
      : result.conversation.sellerProfile.displayName,
    helperText: result.isSeller
      ? "This conversation is about one of your horses."
      : `You contacted ${result.conversation.sellerProfile.displayName} about this horse.`,
    messages: result.conversation.messages,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await loadConversationForParticipant(id, session.user.id);

  if (!result) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const body = await req.json();

  if (!body.body || !String(body.body).trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // If the sender is the buyer, check whether the seller has blocked this buyer
  if (result.isBuyer) {
    const block = await prisma.sellerContactControl.findUnique({
      where: {
        sellerProfileId_targetUserId: {
          sellerProfileId: result.conversation.sellerId,
          targetUserId: session.user.id,
        },
      },
    });

    if (block?.isBlocked) {
      return NextResponse.json({ error: "You are blocked from messaging this seller." }, { status: 403 });
    }
  }

  const message = await prisma.horseMessage.create({
    data: {
      conversationId: result.conversation.id,
      senderUserId: session.user.id,
      body: String(body.body).trim(),
      messageType: "TEXT",
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await prisma.horseConversation.update({
    where: {
      id: result.conversation.id,
    },
    data:
      result.isBuyer
        ? { buyerLastReadAt: new Date() }
        : { sellerLastReadAt: new Date() },
  });

  return NextResponse.json(message);
}
