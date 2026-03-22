import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { getSellerWriteBlockError } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import { deletePublicAsset, uploadPublicAsset } from "@/lib/storage/public-assets";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uniqueSellerSlug(baseSlug: string, currentSellerId: string) {
  let slug = baseSlug || "seller";
  let counter = 1;

  while (true) {
    const existing = await prisma.sellerProfile.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === currentSellerId) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

function parseFeaturedHorsePayload(rawValue: FormDataEntryValue | null) {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as Array<{
      id: string;
      isBarnFeatured: boolean;
      barnDisplayOrder: number | null;
    }>;

    return parsed.filter((entry) => typeof entry.id === "string");
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    const sellerWriteBlocked = getSellerWriteBlockError(seller);

    if (sellerWriteBlocked) {
      return NextResponse.json({ error: sellerWriteBlocked }, { status: 403 });
    }

    const formData = await req.formData();

    const displayName = String(formData.get("displayName") || "").trim();
    const headline = String(formData.get("headline") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const website = String(formData.get("website") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const primaryNotificationEmail = String(formData.get("primaryNotificationEmail") || "").trim();
    const logo = formData.get("logo");
    const coverImage = formData.get("coverImage");
    const featuredHorses = parseFeaturedHorsePayload(formData.get("featuredHorses"));

    if (!displayName) {
      return NextResponse.json({ error: "Display name is required." }, { status: 400 });
    }

    let logoPath = seller.logo;
    let coverImagePath = seller.coverImage;
    const baseSlug = slugify(displayName);
    const slug = await uniqueSellerSlug(baseSlug, seller.id);

    if (logo instanceof File && logo.size > 0) {
      const bytes = await logo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const storedName = `${seller.id}-${Date.now()}-${safeFileName(logo.name)}`;
      logoPath = `sellers/logos/${storedName}`;
      await uploadPublicAsset({
        key: logoPath,
        body: buffer,
        contentType: logo.type || "application/octet-stream",
      });
    }

    if (coverImage instanceof File && coverImage.size > 0) {
      const bytes = await coverImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const storedName = `${seller.id}-${Date.now()}-${safeFileName(coverImage.name)}`;
      coverImagePath = `sellers/covers/${storedName}`;
      await uploadPublicAsset({
        key: coverImagePath,
        body: buffer,
        contentType: coverImage.type || "application/octet-stream",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextSeller = await tx.sellerProfile.update({
        where: {
          id: seller.id,
        },
        data: {
          displayName,
          slug,
          headline: headline || null,
          location: location || null,
          website: website || null,
          bio: bio || null,
          phone: phone || null,
          primaryNotificationEmail: primaryNotificationEmail || null,
          logo: logoPath || null,
          coverImage: coverImagePath || null,
        },
      });

      if (featuredHorses.length > 0) {
        await Promise.all(
          featuredHorses.map((horse) =>
            tx.horse.updateMany({
              where: {
                id: horse.id,
                sellerProfileId: seller.id,
              },
              data: {
                isBarnFeatured: horse.isBarnFeatured,
                barnDisplayOrder: horse.isBarnFeatured
                  ? horse.barnDisplayOrder ?? 0
                  : null,
              },
            })
          )
        );
      }

      return nextSeller;
    });

    if (logo instanceof File && logo.size > 0 && seller.logo && seller.logo !== updated.logo) {
      await deletePublicAsset(seller.logo).catch(() => null);
    }

    if (coverImage instanceof File && coverImage.size > 0 && seller.coverImage && seller.coverImage !== updated.coverImage) {
      await deletePublicAsset(seller.coverImage).catch(() => null);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Seller settings update failed:", error);
    return NextResponse.json(
      { error: "Unable to save barn settings right now." },
      { status: 500 }
    );
  }
}
