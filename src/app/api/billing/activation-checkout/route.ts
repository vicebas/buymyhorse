import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { type BillingCadenceKey } from "@/lib/billing/plans";
import { createActivationCheckoutSession } from "@/lib/billing/stripe";
import prisma from "@/lib/db/prisma";

const checkoutSchema = z.object({
  cadence: z.enum(["MONTHLY", "YEARLY"]),
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
      return NextResponse.json({ error: "Invalid activation selection." }, { status: 400 });
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

    const checkoutSession = await createActivationCheckoutSession({
      sellerId: seller.id,
      userId: session.user.id,
      displayName: seller.displayName,
      cadence: parsed.data.cadence as BillingCadenceKey,
      origin: new URL(req.url).origin,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start activation checkout right now.",
      },
      { status: 500 }
    );
  }
}
