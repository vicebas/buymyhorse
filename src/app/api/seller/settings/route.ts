import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";

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

    const formData = await req.formData();

    const displayName = String(formData.get("displayName") || "").trim();
    const headline = String(formData.get("headline") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const website = String(formData.get("website") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    const logo = formData.get("logo");

    if (!displayName) {
      return NextResponse.json({ error: "Display name is required." }, { status: 400 });
    }

    let logoPath = seller.logo;
    const baseSlug = slugify(displayName);
    const slug = await uniqueSellerSlug(baseSlug, seller.id);

    if (logo instanceof File && logo.size > 0) {
      const bytes = await logo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "sellers",
        "logos"
      );

      await mkdir(uploadsDir, { recursive: true });

      const storedName = `${seller.id}-${Date.now()}-${safeFileName(logo.name)}`;
      const absolutePath = path.join(uploadsDir, storedName);

      await writeFile(absolutePath, buffer);

      logoPath = `/uploads/sellers/logos/${storedName}`;
    }

    const updated = await prisma.sellerProfile.update({
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
        logo: logoPath || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Seller settings update failed:", error);
    return NextResponse.json(
      { error: "Unable to save seller settings right now." },
      { status: 500 }
    );
  }
}