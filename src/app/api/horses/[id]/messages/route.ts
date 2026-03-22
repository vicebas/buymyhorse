import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import { ensureHorseConversation } from "@/lib/conversations/horse-conversation";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";

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

  const message = await prisma.horseMessage.create({
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

  return NextResponse.json(message);
}
