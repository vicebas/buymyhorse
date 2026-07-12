import prisma from "@/lib/db/prisma";
import { getPlanCadence, type BarnPlanKey } from "@/lib/billing/catalog";
import {
  getExtraHorsePriceId,
  getPlanPriceId,
} from "@/lib/billing/plans";
import { getBillingSettings } from "@/lib/billing/settings";
import { getStripe } from "@/lib/stripe";

export async function ensureSellerStripeCustomer({
  sellerId,
  userId,
  displayName,
}: {
  sellerId: string;
  userId: string;
  displayName: string;
}) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    select: { stripeCustomerId: true },
  });

  if (seller?.stripeCustomerId) {
    return seller.stripeCustomerId;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user?.email || undefined,
    name: displayName || user?.name || undefined,
    metadata: {
      sellerProfileId: sellerId,
      userId,
    },
  });

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createPlanCheckoutSession({
  sellerId,
  userId,
  displayName,
  planKey,
  origin,
}: {
  sellerId: string;
  userId: string;
  displayName: string;
  planKey: BarnPlanKey;
  origin: string;
}) {
  const stripe = getStripe();
  const customerId = await ensureSellerStripeCustomer({
    sellerId,
      userId,
      displayName,
  });
  const priceId = await getPlanPriceId(planKey);
  const cadence = getPlanCadence(planKey);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: `${origin}/mybarn/billing?checkout=success`,
    cancel_url: `${origin}/mybarn/billing?checkout=cancelled`,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      sellerProfileId: sellerId,
      billingKind: "PLAN",
      planKey,
      cadence,
    },
    subscription_data: {
      metadata: {
        sellerProfileId: sellerId,
        billingKind: "PLAN",
        planKey,
        cadence,
      },
    },
  });

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: {
      plan: planKey,
      billingCadence: cadence,
      billingStatus: "INCOMPLETE",
      stripePriceId: priceId,
    },
  });

  return checkoutSession;
}

export async function createExtraHorseCheckoutSession({
  sellerId,
  userId,
  displayName,
  quantity,
  origin,
}: {
  sellerId: string;
  userId: string;
  displayName: string;
  quantity: number;
  origin: string;
}) {
  const stripe = getStripe();
  const customerId = await ensureSellerStripeCustomer({
    sellerId,
    userId,
    displayName,
  });
  const priceId = await getExtraHorsePriceId();

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    success_url: `${origin}/mybarn/billing?extraSlots=success`,
    cancel_url: `${origin}/mybarn/billing?extraSlots=cancelled`,
    line_items: [{ price: priceId, quantity }],
    metadata: {
      sellerProfileId: sellerId,
      billingKind: "EXTRA_HORSE",
      quantity: String(quantity),
    },
  });
}

export async function createEquiTagCheckoutSession({
  sellerId,
  userId,
  displayName,
  equiTagId,
  equiTagOrderId,
  quantity,
  origin,
}: {
  sellerId: string;
  userId: string;
  displayName: string;
  equiTagId: string;
  equiTagOrderId: string;
  quantity: number;
  origin: string;
}) {
  const stripe = getStripe();
  const customerId = await ensureSellerStripeCustomer({
    sellerId,
    userId,
    displayName,
  });

  const settings = await getBillingSettings();
  const priceId = settings.equitagPhysicalPriceId;

  if (!priceId) {
    throw new Error("Missing Stripe price ID for physical EquiTag in admin billing settings.");
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    success_url: `${origin}/mybarn/equitag-orders?checkout=success`,
    cancel_url: `${origin}/mybarn/equitag-orders?checkout=cancelled`,
    line_items: [{ price: priceId, quantity }],
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "NL", "BE", "IE", "NZ", "BR"],
    },
    metadata: {
      sellerProfileId: sellerId,
      billingKind: "EQUITAG_PHYSICAL",
      equiTagId,
      equiTagOrderId,
      quantity: String(quantity),
    },
  });
}
