import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import { ensureHorseConversation } from "@/lib/conversations/horse-conversation";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";
import { dispatchMessageNotification } from "@/lib/notifications/dispatch";
import { markBuyerConversationRead } from "@/lib/notifications/seller";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function loadVisibleHorse(id: string) {
  const horse = await prisma.horse.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      sellerProfileId: true,
      isPublished: true,
      deletedAt: true,
      adminDisabledAt: true,
      sellerProfile: {
        select: {
          adminDisabledAt: true,
          plan: true,
          billingCadence: true,
          billingStatus: true,
          adminPlanOverride: true,
          adminBillingCadenceOverride: true,
          adminBillingStatusOverride: true,
          adminBillingOverrideReason: true,
          adminBillingOverrideExpiresAt: true,
          trialEndsAt: true,
          currentPeriodEndsAt: true,
        },
      },
    },
  });

  if (!horse || !isHorsePubliclyVisible(horse)) {
    return null;
  }

  return horse;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const horse = await loadVisibleHorse(id);

  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const conversation = await prisma.horseConversation.findUnique({
    where: {
      horseId_buyerId: {
        horseId: horse.id,
        buyerId: session.user.id,
      },
    },
    include: {
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

  if (conversation) {
    await markBuyerConversationRead(conversation.id, session.user.id);
  }

  return NextResponse.json(conversation?.messages || []);
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const text = String(body.body || "").trim();

  if (!text) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const horse = await loadVisibleHorse(id);

  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const conversation = await ensureHorseConversation(id, session.user.id, horse.sellerProfileId);

  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.horseMessage.create({
      data: {
        conversationId: conversation.id,
        senderUserId: session.user.id,
        body: text,
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

    await tx.horseConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        buyerLastReadAt: new Date(),
      },
    });

    return createdMessage;
  });

  // Fire-and-forget: notify the other party
  ;(async () => {
    try {
      const fullConversation = await prisma.horseConversation.findUnique({
        where: { id: conversation.id },
        select: {
          id: true,
          horse: { select: { id: true, name: true, sellerProfile: { select: { userId: true, displayName: true, user: { select: { id: true, email: true, name: true } } } } } },
          buyer: { select: { id: true, email: true, name: true } },
        },
      })
      if (!fullConversation) return

      const senderUserId = session.user.id
      const isSenderBuyer = senderUserId === fullConversation.buyer.id

      const recipient = isSenderBuyer
        ? { id: fullConversation.horse.sellerProfile.user.id, email: fullConversation.horse.sellerProfile.user.email, name: fullConversation.horse.sellerProfile.displayName }
        : { id: fullConversation.buyer.id, email: fullConversation.buyer.email, name: fullConversation.buyer.name }

      const senderName = isSenderBuyer
        ? (fullConversation.buyer.name ?? "A buyer")
        : fullConversation.horse.sellerProfile.displayName

      await dispatchMessageNotification({
        conversationId: fullConversation.id,
        recipientUserId: recipient.id,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        senderName,
        horseName: fullConversation.horse.name,
        horseId: fullConversation.horse.id,
        isSellerRecipient: isSenderBuyer,
      })
    } catch {
      // swallow errors
    }
  })()

  return NextResponse.json(message);
}
