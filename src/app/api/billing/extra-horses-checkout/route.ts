import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { getBarnEntitlements } from "@/lib/billing/entitlements";
import { createExtraHorseCheckoutSession } from "@/lib/billing/stripe";
import prisma from "@/lib/db/prisma";

const checkoutSchema = z.object({
  quantity: z.number().int().min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid extra horse quantity." }, { status: 400 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        displayName: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Barn not found." }, { status: 404 });
    }

    const entitlements = await getBarnEntitlements(seller.id);

    if (!entitlements.billingActive) {
      return NextResponse.json(
        { error: "MyBarn activation must be active before you can buy additional horse profiles." },
        { status: 403 }
      );
    }

    const checkoutSession = await createExtraHorseCheckoutSession({
      sellerId: seller.id,
      userId: session.user.id,
      displayName: seller.displayName,
      quantity: parsed.data.quantity,
      origin: new URL(req.url).origin,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start extra horse checkout right now.",
      },
      { status: 500 }
    );
  }
}
