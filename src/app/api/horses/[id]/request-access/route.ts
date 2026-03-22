import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";
import { isDocumentCategory } from "@/lib/vault/document-categories";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

type RequestBody = {
  categories?: string[];
  intendedUse?: string;
  message?: string;
};

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    const selectedCategories = [...new Set((body.categories ?? []).map((value) => String(value).trim().toUpperCase()).filter(Boolean))];
    const intendedUse = body.intendedUse?.trim() || "";
    const message = body.message?.trim() || null;

    if (selectedCategories.length === 0) {
      return NextResponse.json(
        { error: "Select at least one document category." },
        { status: 400 }
      );
    }

    if (!selectedCategories.every(isDocumentCategory)) {
      return NextResponse.json({ error: "One or more categories are invalid." }, { status: 400 });
    }

    if (!intendedUse) {
      return NextResponse.json(
        { error: "Tell the seller how you plan to use these records." },
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

    const existingPendingRequest = await prisma.accessRequest.findFirst({
      where: {
        horseId: horse.id,
        buyerId: session.user.id,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        { error: "You already have a pending access request for this horse." },
        { status: 409 }
      );
    }

    const accessRequest = await prisma.accessRequest.create({
      data: {
        horseId: horse.id,
        buyerId: session.user.id,
        intendedUse,
        message,
        requestedCategories: {
          create: selectedCategories.map((category) => ({
            category,
          })),
        },
      },
      select: {
        id: true,
        status: true,
        intendedUse: true,
        message: true,
        createdAt: true,
        requestedCategories: {
          select: {
            category: true,
          },
        },
      },
    });

    await prisma.vaultActivityLog.create({
      data: {
        horseId: horse.id,
        accessRequestId: accessRequest.id,
        actorUserId: session.user.id,
        activityType: "ACCESS_REQUEST_CREATED",
        metadata: {
          categories: selectedCategories,
          intendedUse,
          message,
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
