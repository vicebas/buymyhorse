import prisma from "@/lib/db/prisma";

export const DEFAULT_BILLING_SETTINGS = {
  activationTrialEnabled: false,
  activationTrialDays: 7,
  singleHorsePriceId: process.env.STRIPE_PRICE_SINGLE_HORSE || "",
  barnStarterPriceId: process.env.STRIPE_PRICE_BARN_STARTER || "",
  barnGrowthPriceId: process.env.STRIPE_PRICE_BARN_GROWTH || "",
  barnUnlimitedPriceId: process.env.STRIPE_PRICE_BARN_UNLIMITED || "",
  extraHorsePriceId: process.env.STRIPE_PRICE_EXTRA_HORSE || "",
  equitagPhysicalPriceId: process.env.STRIPE_PRICE_EQUITAG_PHYSICAL || "",
  equitagMaxBatchQuantity: 10,
};

export async function getBillingSettings() {
  const settings = await prisma.billingSettings.findUnique({
    where: { id: "default" },
  });

  return {
    id: settings?.id || "default",
    activationTrialEnabled:
      settings?.activationTrialEnabled ?? DEFAULT_BILLING_SETTINGS.activationTrialEnabled,
    activationTrialDays:
      settings?.activationTrialDays ?? DEFAULT_BILLING_SETTINGS.activationTrialDays,
    singleHorsePriceId:
      settings?.singleHorsePriceId || DEFAULT_BILLING_SETTINGS.singleHorsePriceId,
    barnStarterPriceId:
      settings?.barnStarterPriceId || DEFAULT_BILLING_SETTINGS.barnStarterPriceId,
    barnGrowthPriceId:
      settings?.barnGrowthPriceId || DEFAULT_BILLING_SETTINGS.barnGrowthPriceId,
    barnUnlimitedPriceId:
      settings?.barnUnlimitedPriceId || DEFAULT_BILLING_SETTINGS.barnUnlimitedPriceId,
    extraHorsePriceId: settings?.extraHorsePriceId || DEFAULT_BILLING_SETTINGS.extraHorsePriceId,
    equitagPhysicalPriceId:
      settings?.equitagPhysicalPriceId || DEFAULT_BILLING_SETTINGS.equitagPhysicalPriceId,
    equitagMaxBatchQuantity:
      settings?.equitagMaxBatchQuantity ?? DEFAULT_BILLING_SETTINGS.equitagMaxBatchQuantity,
    stripeSecretKeyConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    updatedAt: settings?.updatedAt ?? null,
    updatedByUserId: settings?.updatedByUserId ?? null,
  };
}
