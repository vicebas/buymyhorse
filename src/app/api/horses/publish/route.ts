import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { getHorseWriteBlockError, getSellerWriteBlockError } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import { canPublishHorseForSeller, validateHorseForPublishing } from "@/lib/billing/entitlements";
import { NotificationType } from "@/generated/prisma/client";
import { dispatchHorseNotification } from "@/lib/notifications/dispatch";
import { trackBackendErrorSafely } from "@/lib/errors/track";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        displayName: true,
        slug: true,
        adminDisabledAt: true,
        adminDisableReason: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 400 }
      );
    }

    const sellerWriteBlocked = getSellerWriteBlockError(seller);

    if (sellerWriteBlocked) {
      return NextResponse.json({ error: sellerWriteBlocked }, { status: 403 });
    }

    const body = await req.json();

    const existingHorse = await prisma.horse.findUnique({
      where: {
        id: body.id,
      },
      select: {
        id: true,
        sellerProfileId: true,
        name: true,
        age: true,
        height: true,
        location: true,
        description: true,
        image: true,
        breedOptionId: true,
        sexOptionId: true,
        primaryDisciplineId: true,
        pricingVisibilityOptionId: true,
        idealRiders: {
          select: {
            idealRiderOptionId: true,
          },
        },
        horseTypes: {
          select: {
            horseTypeOptionId: true,
          },
        },
        divisionTags: {
          where: {
            context: "BEST_SUITED_FOR",
          },
          select: {
            divisionOptionId: true,
          },
        },
        adminDisabledAt: true,
        adminDisableReason: true,
        sellerProfile: {
          select: {
            adminDisabledAt: true,
            adminDisableReason: true,
          },
        },
      },
    });

    if (!existingHorse || existingHorse.sellerProfileId !== seller.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const horseWriteBlocked = getHorseWriteBlockError(existingHorse);

    if (horseWriteBlocked) {
      return NextResponse.json({ error: horseWriteBlocked }, { status: 403 });
    }

    const nextPublishedState = Boolean(body.isPublished);

    if (nextPublishedState) {
      const publishValidation = validateHorseForPublishing({
        ...existingHorse,
        bestSuitedForIds: existingHorse.divisionTags.map((item) => item.divisionOptionId),
        idealRiderIds: existingHorse.idealRiders.map((item) => item.idealRiderOptionId),
        horseTypeIds: existingHorse.horseTypes.map((item) => item.horseTypeOptionId),
      });

      if (!publishValidation.isPublishReady) {
        return NextResponse.json(
          {
            error: `Complete the listing before publishing. Missing: ${publishValidation.missing.join(", ")}.`,
          },
          { status: 400 }
        );
      }

      const canPublish = await canPublishHorseForSeller({
        sellerId: seller.id,
        excludeHorseId: existingHorse.id,
      });

      if (!canPublish) {
        return NextResponse.json(
          {
            error: "Your current activation does not include another published horse profile. Buy additional horse profiles or keep this horse inactive.",
          },
          { status: 403 }
        );
      }
    }

    const horse = await prisma.horse.update({
      where: {
        id: body.id,
      },
      data: {
        isPublished: nextPublishedState,
        isActive: nextPublishedState,
      },
    });

    if (nextPublishedState === true) {
      dispatchHorseNotification({
        type: NotificationType.NEW_HORSE_FROM_FOLLOWED_BARN,
        sellerProfileId: horse.sellerProfileId,
        horseId: horse.id,
        horseName: horse.name,
        barnName: seller.displayName,
        barnSlug: seller.slug ?? "",
      }).catch((err) => { console.error("[horses/publish] dispatchHorseNotification failed", err); })
    }

    return NextResponse.json(horse);
  } catch (error) {
    void trackBackendErrorSafely({
      error,
      route: "/api/horses/publish",
      method: "POST",
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
