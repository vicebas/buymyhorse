import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";

const sellerSchema = z.object({
  displayName: z.string().trim().min(2, "Seller display name is required."),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  website: z.url("Website must be a valid URL.").optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uniqueSellerSlug(baseSlug: string) {
  let slug = baseSlug || "seller";
  let counter = 1;

  while (true) {
    const existing = await prisma.sellerProfile.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;

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

    const body = await req.json();
    const parsed = sellerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request." },
        { status: 400 }
      );
    }

    const existing = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Seller profile already exists." },
        { status: 400 }
      );
    }

    const baseSlug = slugify(parsed.data.displayName);
    const slug = await uniqueSellerSlug(baseSlug);

    const seller = await prisma.sellerProfile.create({
      data: {
        userId: session.user.id,
        displayName: parsed.data.displayName,
        slug,
        location: parsed.data.location || null,
        website: parsed.data.website || null,
        bio: parsed.data.bio || null,
      },
      select: {
        id: true,
        displayName: true,
        slug: true,
      },
    });

    return NextResponse.json(seller, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create seller profile right now." },
      { status: 500 }
    );
  }
}