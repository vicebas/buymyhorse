import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAppOrigin } from "@/lib/app-url";
import { authOptions } from "@/lib/auth/options";
import { getPlanCadence, type BarnPlanKey } from "@/lib/billing/catalog";
import { getBillingSettings } from "@/lib/billing/settings";
import { createPlanCheckoutSession } from "@/lib/billing/stripe";
import prisma from "@/lib/db/prisma";

const sellerSchema = z.object({
  displayName: z.string().trim().min(2, "Barn display name is required."),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  website: z.url("Website must be a valid URL.").optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  planKey: z.enum(["SINGLE_HORSE", "BARN_STARTER", "BARN_GROWTH", "BARN_UNLIMITED"]),
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uniqueSellerSlug(baseSlug: string) {
  const normalizedBaseSlug = baseSlug || "barn";
  let slug = normalizedBaseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.sellerProfile.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;

    counter += 1;
    slug = `${normalizedBaseSlug}-${counter}`;
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
    const now = new Date();
    const billingSettings = await getBillingSettings();
    const hasTrial = billingSettings.activationTrialEnabled && billingSettings.activationTrialDays > 0;
    const billingCadence = getPlanCadence(parsed.data.planKey as BarnPlanKey);

    const seller = await prisma.sellerProfile.create({
      data: {
        userId: session.user.id,
        displayName: parsed.data.displayName,
        slug,
        location: parsed.data.location || null,
        website: parsed.data.website || null,
        bio: parsed.data.bio || null,
        plan: parsed.data.planKey as BarnPlanKey,
        billingCadence,
        billingStatus: hasTrial ? "TRIALING" : "INCOMPLETE",
        trialEndsAt: hasTrial
          ? new Date(now.getTime() + billingSettings.activationTrialDays * 24 * 60 * 60 * 1000)
          : null,
      },
      select: {
        id: true,
        displayName: true,
        slug: true,
        plan: true,
        billingCadence: true,
      },
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role === "BUYER") {
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          role: "SELLER",
        },
      });
    }

    if (hasTrial) {
      return NextResponse.json(
        {
          seller,
          redirectTo: "/mybarn",
        },
        { status: 201 }
      );
    }

    const checkoutSession = await createPlanCheckoutSession({
      sellerId: seller.id,
      userId: session.user.id,
      displayName: seller.displayName,
      planKey: parsed.data.planKey as BarnPlanKey,
      origin: getAppOrigin(req),
    });

    return NextResponse.json(
      {
        seller,
        redirectTo: checkoutSession.url || "/mybarn/billing",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create barn profile right now.",
      },
      { status: 500 }
    );
  }
}
