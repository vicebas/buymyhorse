import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import { ensureHorseConversation } from "@/lib/conversations/horse-conversation";
import { markBuyerConversationRead } from "@/lib/notifications/seller";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const horse = await prisma.horse.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      sellerProfileId: true,
      isPublished: true,
      deletedAt: true,
      adminDisabledAt: true,
      sellerProfile: {
        select: {
          userId: true,
          displayName: true,
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

  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  if (!isHorsePubliclyVisible(horse)) {
    return NextResponse.json({ error: "This horse is not available for messaging." }, { status: 403 });
  }

  if (horse.sellerProfile.userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot message your own listing." },
      { status: 400 }
    );
  }

  const conversation = await ensureHorseConversation(
    horse.id,
    session.user.id,
    horse.sellerProfileId
  );

  await markBuyerConversationRead(conversation.id, session.user.id);

  const messages = await prisma.horseMessage.findMany({
    where: {
      conversationId: conversation.id,
    },
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
  });

  return NextResponse.json({
    conversationId: conversation.id,
    messages,
    currentUserId: session.user.id,
    horseId: horse.id,
    horseName: horse.name,
    counterpartyName: horse.sellerProfile.displayName,
    fullConversationHref: `/messages/${conversation.id}`,
  });
}
