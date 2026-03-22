import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { getSellerWriteBlockError } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import { canPublishHorseForSeller, validateHorseForPublishing } from "@/lib/billing/entitlements";
import { createHorseEquiTag } from "@/lib/equitag/service";
import { deletePublicAsset, uploadPublicAsset } from "@/lib/storage/public-assets";

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
  const breed = String(formData.get("breed") || "").trim();
  const age = String(formData.get("age") || "").trim();
  const price = String(formData.get("price") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const discipline = String(formData.get("discipline") || "").trim();
  const level = String(formData.get("level") || "").trim();
  const height = String(formData.get("height") || "").trim();
  const gender = String(formData.get("gender") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const keyDetails = String(formData.get("keyDetails") || "").trim();
  const saleStatus = String(formData.get("saleStatus") || "FOR_SALE").trim();
  const publishToMarketplace = formData.get("isPublished") === "on";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const file = formData.get("image") as File | null;
  let imagePath: string | null = null;

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
      breed,
      age: age ? Number(age) : null,
      discipline,
      level,
      height,
      gender,
      location,
      description,
      image: imagePath,
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
          error: "Your current activation does not include another published horse slot. Buy extra horse slots or keep this horse inactive.",
        },
        { status: 403 }
      );
    }
  }

  const horse = await prisma.horse.create({
    data: {
      sellerProfileId: seller.id,
      name,
      breed: breed || null,
      age: age ? Number(age) : null,
      price: price ? price : null,
      description: description || null,
      discipline: discipline || null,
      level: level || null,
      height: height || null,
      gender: gender || null,
      location: location || null,
      keyDetails: keyDetails || null,
      saleStatus: saleStatus as
        | "FOR_SALE"
        | "SOLD"
        | "CONSIDERING_OFFERS"
        | "LEASE"
        | "NOT_AVAILABLE",
      image: imagePath,
      isPublished: publishToMarketplace,
      isActive: publishToMarketplace,
    },
  });

  try {
    await createHorseEquiTag(seller.id, horse.id);
  } catch (error) {
    console.error('Failed to create horse EquiTag', error);
    await prisma.horse.delete({ where: { id: horse.id } }).catch(() => null);
    await deletePublicAsset(imagePath).catch(() => null);

    return NextResponse.json(
      {
        error: 'Horse could not be created because its EquiTag could not be generated. Please try again.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json(horse);
}
