import prisma from "@/lib/db/prisma";
import { getActivationPriceId, getExtraHorsePriceId, type BillingCadenceKey } from "@/lib/billing/plans";
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

export async function createActivationCheckoutSession({
  sellerId,
  userId,
  displayName,
  cadence,
  origin,
}: {
  sellerId: string;
  userId: string;
  displayName: string;
  cadence: BillingCadenceKey;
  origin: string;
}) {
  const stripe = getStripe();
  const customerId = await ensureSellerStripeCustomer({
    sellerId,
    userId,
    displayName,
  });
  const priceId = await getActivationPriceId(cadence);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: `${origin}/mybarn/billing?checkout=success`,
    cancel_url: `${origin}/mybarn/billing?checkout=cancelled`,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      sellerProfileId: sellerId,
      billingKind: "ACTIVATION",
      cadence,
    },
    subscription_data: {
      metadata: {
        sellerProfileId: sellerId,
        billingKind: "ACTIVATION",
        cadence,
      },
    },
  });

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: {
      plan: "ACTIVATION",
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
