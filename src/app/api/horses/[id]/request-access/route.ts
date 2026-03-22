import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

type RequestBody = {
  description?: string;
};

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    const description = body.description?.trim() || "";

    if (!description) {
      return NextResponse.json(
        { error: "Please describe the records you want to review." },
        { status: 400 }
      );
    }

    const horse = await prisma.horse.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        isPublished: true,
        deletedAt: true,
        adminDisabledAt: true,
        sellerProfileId: true,
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
      return NextResponse.json({ error: "Horse not found." }, { status: 404 });
    }

    const buyer = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        sellerProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found." }, { status: 404 });
    }

    if (buyer.sellerProfile?.id === horse.sellerProfileId) {
      return NextResponse.json(
        { error: "You cannot request access to your own horse." },
        { status: 400 }
      );
    }

    const accessRequest = await prisma.accessRequest.create({
      data: {
        horseId: horse.id,
        buyerId: session.user.id,
        message: description,
      },
      select: {
        id: true,
        status: true,
        message: true,
        createdAt: true,
      },
    });

    await prisma.vaultActivityLog.create({
      data: {
        horseId: horse.id,
        accessRequestId: accessRequest.id,
        actorUserId: session.user.id,
        activityType: "ACCESS_REQUEST_CREATED",
        metadata: {
          description,
        },
      },
    });

    return NextResponse.json(accessRequest, { status: 201 });
  } catch (error) {
    console.error("Horse access request failed:", error);
    return NextResponse.json(
      { error: "Unable to submit access request right now." },
      { status: 500 }
    );
  }
}
