import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getAppOrigin } from "@/lib/app-url";
import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import { getStripe } from "@/lib/stripe";

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
      select: {
        stripeCustomerId: true,
      },
    });

    if (!seller?.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer found." }, { status: 400 });
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: seller.stripeCustomerId,
      return_url: `${getAppOrigin(req)}/mybarn/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open the Stripe billing portal right now.",
      },
      { status: 500 }
    );
  }
}
