import { NextResponse } from "next/server";
import Stripe from "stripe";

import prisma from "@/lib/db/prisma";
import { type BarnPlanKey, type BillingCadenceKey } from "@/lib/billing/catalog";
import { getBillingProductFromPriceId } from "@/lib/billing/plans";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe webhook configuration." }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed.", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncSubscription(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode === "payment") {
    const billingKind = session.metadata?.billingKind;
    if (billingKind === "EQUITAG_PHYSICAL") {
      await syncEquiTagOrderPayment(session);
    } else {
      await syncExtraHorsePurchase(session);
    }
    return;
  }

  const subscription = await loadSubscriptionFromCheckoutSession(session);

  if (subscription) {
    await syncSubscription(subscription);
  }
}

async function loadSubscriptionFromCheckoutSession(session: Stripe.Checkout.Session) {
  if (!session.subscription) {
    return null;
  }

  const stripe = getStripe();
  return stripe.subscriptions.retrieve(String(session.subscription));
}

function getPlanProductFromSubscriptionMetadata(subscription: Stripe.Subscription) {
  const billingKind = subscription.metadata?.billingKind;
  const planKey = subscription.metadata?.planKey;
  const cadence = subscription.metadata?.cadence;

  if (billingKind !== "PLAN") {
    return null;
  }

  const hasValidPlan =
    planKey === "SINGLE_HORSE" ||
    planKey === "BARN_STARTER" ||
    planKey === "BARN_GROWTH" ||
    planKey === "BARN_UNLIMITED";
  const hasValidCadence = cadence === "MONTHLY" || cadence === "SEMIANNUAL";

  if (hasValidPlan && hasValidCadence) {
    return {
      kind: "PLAN" as const,
      planKey: planKey as BarnPlanKey,
      cadence: cadence as BillingCadenceKey,
    };
  }

  return null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id || null;
  const metadataProduct = getPlanProductFromSubscriptionMetadata(subscription);
  const product = metadataProduct || (await getBillingProductFromPriceId(priceId));

  if (!product || product.kind !== "PLAN") {
    return;
  }

  const customerId = String(subscription.customer);

  await prisma.sellerProfile.updateMany({
    where: {
      stripeCustomerId: customerId,
    },
    data: {
      plan: product.planKey,
      billingCadence: product.cadence,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      billingStatus: mapStripeStatus(subscription.status),
      currentPeriodEndsAt: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000)
        : null,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });
}

async function syncExtraHorsePurchase(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") {
    return;
  }

  const sellerProfileId = session.metadata?.sellerProfileId;
  const quantity = Number(session.metadata?.quantity || 0);

  if (!sellerProfileId || !Number.isFinite(quantity) || quantity <= 0) {
    return;
  }

  await prisma.barnHorseSlotLedger.upsert({
    where: {
      stripeCheckoutSessionId: session.id,
    },
    update: {
      quantity,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      note: "Stripe extra horse purchase",
    },
    create: {
      sellerProfileId,
      quantity,
      source: "STRIPE_PURCHASE",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      note: "Stripe extra horse purchase",
    },
  });
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "incomplete_expired":
      return "EXPIRED";
    case "past_due":
    case "unpaid":
    case "paused":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

async function syncEquiTagOrderPayment(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") {
    return;
  }

  const equiTagOrderId = session.metadata?.equiTagOrderId;

  if (!equiTagOrderId) {
    return;
  }

  const shipping = session.collected_information?.shipping_details;

  await prisma.equiTagOrder.update({
    where: { id: equiTagOrderId },
    data: {
      canceledBySellerAt: null,
      canceledByAdminAt: null,
      status: "CONFIRMED",
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      shippingName: shipping?.name || null,
      shippingAddressLine1: shipping?.address?.line1 || null,
      shippingAddressLine2: shipping?.address?.line2 || null,
      shippingCity: shipping?.address?.city || null,
      shippingState: shipping?.address?.state || null,
      shippingPostalCode: shipping?.address?.postal_code || null,
      shippingCountry: shipping?.address?.country || null,
    },
  });
}
