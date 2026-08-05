import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { getSellerWriteBlockError } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import { canPublishHorseForSeller, validateHorseForPublishing } from "@/lib/billing/entitlements";
import { createHorseEquiTag } from "@/lib/equitag/service";
import { buildHorseListingMutation, buildHorseListingRelationWrites } from "@/lib/horses/upsert-horse-listing";
import { parseStringList } from "@/lib/horses/listing-options";
import { deletePublicAsset, uploadPublicAsset } from "@/lib/storage/public-assets";
import { NotificationType } from "@/generated/prisma/client";
import { dispatchHorseNotification } from "@/lib/notifications/dispatch";
import { trackProductEventSafely } from "@/lib/product-events/track";
import { hasHorsePhotoSelection, parseHorsePhotoPlan, syncHorsePhotoPlan } from "@/lib/media/horse-photo-plan";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
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
  const sireOptionId = String(formData.get("sireOptionId") || "").trim() || null;
  const damOptionId = String(formData.get("damOptionId") || "").trim() || null;
  const damSireOptionId = String(formData.get("damSireOptionId") || "").trim() || null;
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
      image: hasHorsePhotoSelection(photoPlan) ? "planned-photo" : null,
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

    const canPublish = await canPublishHorseForSeller({ sellerId: seller.id });

    if (!canPublish) {
        return NextResponse.json(
          {
          error: "Your current billing plan does not include another published horse profile. Buy additional horse profiles or keep this horse inactive.",
          },
          { status: 403 }
        );
    }
  }

  const horse = await prisma.horse.create({
    data: {
      sellerProfileId: seller.id,
      ...buildHorseListingMutation({
        name,
        age: age ? Number(age) : null,
        height: height || null,
        location: location || null,
        description: description || null,
        keyDetails: keyDetails || null,
        isPublished: publishToMarketplace,
        image: null,
        breedOptionId,
        sexOptionId,
        primaryDisciplineId,
        pricingVisibilityOptionId,
        colorOptionId,
        importStatusOptionId,
        sireOptionId,
        damOptionId,
        damSireOptionId,
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
      ...buildHorseListingRelationWrites({
        name,
        age: age ? Number(age) : null,
        height: height || null,
        location: location || null,
        description: description || null,
        keyDetails: keyDetails || null,
        isPublished: publishToMarketplace,
        image: null,
        breedOptionId,
        sexOptionId,
        primaryDisciplineId,
        pricingVisibilityOptionId,
        colorOptionId,
        importStatusOptionId,
        sireOptionId,
        damOptionId,
        damSireOptionId,
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

  if (photoPlan.length > 0) {
    await syncHorsePhotoPlan({
      horseId: horse.id,
      currentImagePath: horse.image,
      existingImageMedia: [],
      plan: photoPlan,
      newPhotoFiles,
    });
  }

  try {
    await createHorseEquiTag(seller.id, horse.id);
  } catch (error) {
    console.error('Failed to create horse EquiTag', error);
    await prisma.horse.delete({ where: { id: horse.id } }).catch(() => null);
    await deletePublicAsset(horse.image).catch(() => null);

    return NextResponse.json(
      {
        error: 'Horse could not be created because its EquiTag could not be generated. Please try again.',
      },
      { status: 500 }
    );
  }

  void trackProductEventSafely({
    actorUserId: session.user.id,
    eventType: "HORSE_CREATION",
    horseId: horse.id,
  });

  if (horse.isPublished) {
    dispatchHorseNotification({
      type: NotificationType.NEW_HORSE_FROM_FOLLOWED_BARN,
      sellerProfileId: horse.sellerProfileId,
      horseId: horse.id,
      horseName: horse.name,
      barnName: seller.displayName,
      barnSlug: seller.slug ?? "",
    }).catch(() => {})
  }

  return NextResponse.json(
    await prisma.horse.findUnique({
      where: { id: horse.id },
    })
  );
}
