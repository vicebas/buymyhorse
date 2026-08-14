import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { NotificationType } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import { getHorseWriteBlockError, getSellerWriteBlockError } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import { canPublishHorseForSeller, validateHorseForPublishing } from "@/lib/billing/entitlements";
import {
  buildHorseListingMutation,
  buildHorseListingRelationUpdateWrites,
} from "@/lib/horses/upsert-horse-listing";
import { parseStringList } from "@/lib/horses/listing-options";
import { dispatchHorseNotification } from "@/lib/notifications/dispatch";
import { trackProductEventSafely } from "@/lib/product-events/track";
import { deletePublicAsset, uploadPublicAsset } from "@/lib/storage/public-assets";
import { hasHorsePhotoSelection, parseHorsePhotoPlan, syncHorsePhotoPlan } from "@/lib/media/horse-photo-plan";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
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

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      adminDisabledAt: true,
      adminDisableReason: true,
      displayName: true,
      slug: true,
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 400 });
  }

  const sellerWriteBlocked = getSellerWriteBlockError(seller);

  if (sellerWriteBlocked) {
    return NextResponse.json({ error: sellerWriteBlocked }, { status: 403 });
  }

  const existingHorse = await prisma.horse.findFirst({
    where: {
      id,
      sellerProfileId: seller.id,
    },
    include: {
      sellerProfile: {
        select: {
          adminDisabledAt: true,
          adminDisableReason: true,
        },
      },
      saleTypes: {
        select: {
          saleTypeOptionId: true,
        },
      },
    },
  });

  if (!existingHorse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const horseWriteBlocked = getHorseWriteBlockError(existingHorse);

  if (horseWriteBlocked) {
    return NextResponse.json({ error: horseWriteBlocked }, { status: 403 });
  }

  const formData = await req.formData();

  const name = String(formData.get("name") || "").trim();
  const age = String(formData.get("age") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const height = String(formData.get("height") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const keyDetails = String(formData.get("keyDetails") || "").trim();
  const publishToMarketplace = formData.get("isPublished") === "on";
  const breedOptionId = String(formData.get("breedOptionId") || "").trim() || null;
  const sexOptionId = String(formData.get("sexOptionId") || "").trim() || null;
  const primaryDisciplineId = String(formData.get("primaryDisciplineId") || "").trim() || null;
  const pricingVisibilityOptionId = String(formData.get("pricingVisibilityOptionId") || "").trim() || null;
  const colorOptionId = String(formData.get("colorOptionId") || "").trim() || null;
  const importStatusOptionId = String(formData.get("importStatusOptionId") || "").trim() || null;
  const sire = String(formData.get("sire") || "").trim() || null;
  const dam = String(formData.get("dam") || "").trim() || null;
  const damSire = String(formData.get("damSire") || "").trim() || null;
  const saleTypeIds = parseStringList(formData.getAll("saleTypeIds"));
  const secondaryDisciplineIds = parseStringList(formData.getAll("secondaryDisciplineIds"));
  const bestSuitedForIds = parseStringList(formData.getAll("bestSuitedForIds"));
  const currentlyCompetingInIds = parseStringList(formData.getAll("currentlyCompetingInIds"));
  const experiencedThroughIds = parseStringList(formData.getAll("experiencedThroughIds"));
  const horseTypeIds = parseStringList(formData.getAll("horseTypeIds"));
  const feiPassport = formData.get("feiPassport") === "on";
  const equiVaultAvailable = formData.get("equiVaultAvailable") === "on";
  const showHighlights = String(formData.get("showHighlights") || "").trim();
  const photoPlan = parseHorsePhotoPlan(formData.get("photoPlan"));
  const newPhotoFiles = formData
    .getAll("newPhotoFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (publishToMarketplace) {
    const publishValidation = validateHorseForPublishing({
      name,
      age: age ? Number(age) : null,
      height,
      location,
      description,
      image: hasHorsePhotoSelection(photoPlan) ? "planned-photo" : existingHorse.image,
      breedOptionId,
      sexOptionId,
      primaryDisciplineId,
      pricingVisibilityOptionId,
      bestSuitedForIds,
      horseTypeIds,
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
          error: "Your current billing plan does not include another published horse profile. Buy additional horse profiles or keep this horse inactive.",
          },
          { status: 403 }
        );
    }
  }

  const horse = await prisma.horse.update({
    where: {
      id: existingHorse.id,
    },
    data: {
      ...buildHorseListingMutation({
        name,
        age: age ? Number(age) : null,
        height: height || null,
        location: location || null,
        description: description || null,
        keyDetails: keyDetails || null,
        isPublished: publishToMarketplace,
        image: existingHorse.image,
        breedOptionId,
        sexOptionId,
        primaryDisciplineId,
        pricingVisibilityOptionId,
        colorOptionId,
        importStatusOptionId,
        sire,
        dam,
        damSire,
        sireOptionId: null,
        damOptionId: null,
        damSireOptionId: null,
        saleTypeIds,
        secondaryDisciplineIds,
        bestSuitedForIds,
        currentlyCompetingInIds,
        experiencedThroughIds,
        horseTypeIds,
        feiPassport,
        equiVaultAvailable,
        showHighlights: showHighlights || null,
      }),
      ...buildHorseListingRelationUpdateWrites({
        name,
        age: age ? Number(age) : null,
        height: height || null,
        location: location || null,
        description: description || null,
        keyDetails: keyDetails || null,
        isPublished: publishToMarketplace,
        image: existingHorse.image,
        breedOptionId,
        sexOptionId,
        primaryDisciplineId,
        pricingVisibilityOptionId,
        colorOptionId,
        importStatusOptionId,
        sire,
        dam,
        damSire,
        sireOptionId: null,
        damOptionId: null,
        damSireOptionId: null,
        saleTypeIds,
        secondaryDisciplineIds,
        bestSuitedForIds,
        currentlyCompetingInIds,
        experiencedThroughIds,
        horseTypeIds,
        feiPassport,
        equiVaultAvailable,
        showHighlights: showHighlights || null,
      }),
    },
  });

  await syncHorsePhotoPlan({
    horseId: horse.id,
    currentImagePath: existingHorse.image,
    existingImageMedia: await prisma.horseMedia.findMany({
      where: {
        horseId: horse.id,
        type: "IMAGE",
      },
      select: {
        id: true,
        originalPath: true,
        processedPath: true,
        posterPath: true,
        mimeType: true,
        fileName: true,
      },
    }),
    plan: photoPlan,
    newPhotoFiles,
  });

  void trackProductEventSafely({
    actorUserId: session.user.id,
    eventType: "HORSE_EDIT",
    horseId: horse.id,
  });

  const significantFields = ['description', 'keyDetails', 'name', 'location', 'pricingVisibilityOptionId', 'primaryDisciplineId'] as const
  const changedFields: string[] = significantFields.filter(field => {
    const before = (existingHorse as Record<string, unknown>)[field]
    const after = (horse as Record<string, unknown>)[field]
    return String(before ?? '') !== String(after ?? '')
  })

  const previousSaleTypeSet = new Set(existingHorse.saleTypes.map((item) => item.saleTypeOptionId));
  const nextSaleTypeSet = new Set(saleTypeIds);

  if (
    previousSaleTypeSet.size !== nextSaleTypeSet.size ||
    [...previousSaleTypeSet].some((id) => !nextSaleTypeSet.has(id))
  ) {
    changedFields.push('sale type');
  }

  if (horse.isPublished && changedFields.length > 0) {
    dispatchHorseNotification({
      type: NotificationType.HORSE_UPDATED_FROM_FOLLOWED_BARN,
      sellerProfileId: horse.sellerProfileId,
      horseId: horse.id,
      horseName: horse.name,
      barnName: seller.displayName,
      barnSlug: seller.slug,
      changedFields: [...changedFields],
    }).catch(() => {})
  }

  return NextResponse.json(horse);
}
