import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  if (stripeInstance) {
    return stripeInstance;
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  stripeInstance = new Stripe(apiKey, {
    apiVersion: "2025-02-24.acacia",
  });

  return stripeInstance;
}
