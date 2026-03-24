import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { createEquiTagCheckoutSession } from "@/lib/billing/stripe";
import prisma from "@/lib/db/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, displayName: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
  }

  const order = await prisma.equiTagOrder.findFirst({
    where: {
      id,
      sellerProfileId: seller.id,
      status: "PENDING_PAYMENT",
      canceledBySellerAt: null,
    },
    select: {
      id: true,
      equiTagId: true,
      quantity: true,
      stripeCheckoutSessionId: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pending payment order not found." }, { status: 404 });
  }

  if (order.stripeCheckoutSessionId) {
    try {
      await getStripe().checkout.sessions.expire(order.stripeCheckoutSessionId);
    } catch {
      // Ignore already-expired or non-open sessions.
    }
  }

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const checkoutSession = await createEquiTagCheckoutSession({
    sellerId: seller.id,
    userId: session.user.id,
    displayName: seller.displayName,
    equiTagId: order.equiTagId,
    equiTagOrderId: order.id,
    quantity: order.quantity,
    origin,
  });

  await prisma.equiTagOrder.update({
    where: { id: order.id },
    data: {
      stripeCheckoutSessionId: checkoutSession.id,
      canceledBySellerAt: null,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
