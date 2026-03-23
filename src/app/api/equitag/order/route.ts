import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { createEquiTagCheckoutSession } from "@/lib/billing/stripe";
import { getBillingSettings } from "@/lib/billing/settings";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    equiTagId?: string;
    quantity?: number;
  } | null;

  const equiTagId = body?.equiTagId?.trim();
  const quantity = body?.quantity ?? 1;

  if (!equiTagId) {
    return NextResponse.json({ error: "Missing equiTagId." }, { status: 400 });
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
  }

  const settings = await getBillingSettings();
  const maxQty = settings.equitagMaxBatchQuantity;

  if (quantity > maxQty) {
    return NextResponse.json(
      { error: `Maximum quantity per order is ${maxQty}.` },
      { status: 400 }
    );
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, displayName: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
  }

  const equiTag = await prisma.equiTag.findUnique({
    where: { id: equiTagId },
    select: { id: true, ownerSellerProfileId: true },
  });

  if (!equiTag || equiTag.ownerSellerProfileId !== seller.id) {
    return NextResponse.json({ error: "EquiTag not found." }, { status: 404 });
  }

  const existingActiveOrder = await prisma.equiTagOrder.findFirst({
    where: {
      equiTagId,
      status: { notIn: ["CANCELLED", "DELIVERED"] },
    },
    select: { id: true, status: true },
  });

  if (existingActiveOrder) {
    return NextResponse.json(
      { error: "An active order already exists for this EquiTag." },
      { status: 409 }
    );
  }

  const order = await prisma.equiTagOrder.create({
    data: {
      sellerProfileId: seller.id,
      equiTagId,
      quantity,
      status: "PENDING_PAYMENT",
    },
  });

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const checkoutSession = await createEquiTagCheckoutSession({
    sellerId: seller.id,
    userId: session.user.id,
    displayName: seller.displayName,
    equiTagId,
    equiTagOrderId: order.id,
    quantity,
    origin,
  });

  await prisma.equiTagOrder.update({
    where: { id: order.id },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
