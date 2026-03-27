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
  const saleStatus = String(formData.get("saleStatus") || "FOR_SALE").trim();
  const publishToMarketplace = formData.get("isPublished") === "on";
  const breedOptionId = String(formData.get("breedOptionId") || "").trim() || null;
  const sexOptionId = String(formData.get("sexOptionId") || "").trim() || null;
  const primaryDisciplineId = String(formData.get("primaryDisciplineId") || "").trim() || null;
  const pricingVisibilityOptionId = String(formData.get("pricingVisibilityOptionId") || "").trim() || null;
  const saleTypeOptionId = String(formData.get("saleTypeOptionId") || "").trim() || null;
  const colorOptionId = String(formData.get("colorOptionId") || "").trim() || null;
  const importStatusOptionId = String(formData.get("importStatusOptionId") || "").trim() || null;
  const secondaryDisciplineIds = parseStringList(formData.getAll("secondaryDisciplineIds"));
  const bestSuitedForIds = parseStringList(formData.getAll("bestSuitedForIds"));
  const currentlyCompetingInIds = parseStringList(formData.getAll("currentlyCompetingInIds"));
  const experiencedThroughIds = parseStringList(formData.getAll("experiencedThroughIds"));
  const schoolingThroughIds = parseStringList(formData.getAll("schoolingThroughIds"));
  const idealRiderIds = parseStringList(formData.getAll("idealRiderIds"));
  const horseTypeIds = parseStringList(formData.getAll("horseTypeIds"));
  const feiPassport = formData.get("feiPassport") === "on";
  const equiVaultAvailable = formData.get("equiVaultAvailable") === "on";
  const registrationStatus = String(formData.get("registrationStatus") || "").trim();
  const showHighlights = String(formData.get("showHighlights") || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const file = formData.get("image") as File | null;
  let imagePath = existingHorse.image;

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${safeFileName(file.name)}`;
    const key = `horses/main/${seller.id}/${filename}`;

    await uploadPublicAsset({
      key,
      body: buffer,
      contentType: file.type || "application/octet-stream",
      cacheControl: "public, max-age=31536000, immutable",
    });
    imagePath = key;
  }

  if (publishToMarketplace) {
    const publishValidation = validateHorseForPublishing({
      name,
      age: age ? Number(age) : null,
      height,
      location,
      description,
      image: imagePath,
      breedOptionId,
      sexOptionId,
      primaryDisciplineId,
      pricingVisibilityOptionId,
      bestSuitedForIds,
      idealRiderIds,
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
          error: "Your current activation does not include another published horse profile. Buy additional horse profiles or keep this horse inactive.",
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
        saleStatus: saleStatus as "FOR_SALE" | "CONSIDERING_OFFERS" | "LEASE" | "SOLD" | "NOT_AVAILABLE",
        isPublished: publishToMarketplace,
        image: imagePath,
        breedOptionId,
        sexOptionId,
        primaryDisciplineId,
        pricingVisibilityOptionId,
        saleTypeOptionId,
        colorOptionId,
        importStatusOptionId,
        secondaryDisciplineIds,
        bestSuitedForIds,
        currentlyCompetingInIds,
        experiencedThroughIds,
        schoolingThroughIds,
        idealRiderIds,
        horseTypeIds,
        feiPassport,
        equiVaultAvailable,
        registrationStatus: registrationStatus || null,
        showHighlights: showHighlights || null,
      }),
      ...buildHorseListingRelationUpdateWrites({
        name,
        age: age ? Number(age) : null,
        height: height || null,
        location: location || null,
        description: description || null,
        keyDetails: keyDetails || null,
        saleStatus: saleStatus as "FOR_SALE" | "CONSIDERING_OFFERS" | "LEASE" | "SOLD" | "NOT_AVAILABLE",
        isPublished: publishToMarketplace,
        image: imagePath,
        breedOptionId,
        sexOptionId,
        primaryDisciplineId,
        pricingVisibilityOptionId,
        saleTypeOptionId,
        colorOptionId,
        importStatusOptionId,
        secondaryDisciplineIds,
        bestSuitedForIds,
        currentlyCompetingInIds,
        experiencedThroughIds,
        schoolingThroughIds,
        idealRiderIds,
        horseTypeIds,
        feiPassport,
        equiVaultAvailable,
        registrationStatus: registrationStatus || null,
        showHighlights: showHighlights || null,
      }),
    },
  });

  if (file && file.size > 0 && existingHorse.image && existingHorse.image !== imagePath) {
    await deletePublicAsset(existingHorse.image).catch(() => null);
  }

  void trackProductEventSafely({
    actorUserId: session.user.id,
    eventType: "HORSE_EDIT",
    horseId: horse.id,
  });

  const significantFields = ['saleStatus', 'description', 'keyDetails', 'name', 'location', 'pricingVisibilityOptionId', 'primaryDisciplineId', 'saleTypeOptionId'] as const
  const changedFields = significantFields.filter(field => {
    const before = (existingHorse as Record<string, unknown>)[field]
    const after = (horse as Record<string, unknown>)[field]
    return String(before ?? '') !== String(after ?? '')
  })

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
