import prisma from "@/lib/db/prisma";

export const DEFAULT_BILLING_SETTINGS = {
  activationTrialEnabled: false,
  activationTrialDays: 7,
  activationMonthlyPriceId: process.env.STRIPE_PRICE_ACTIVATION_MONTHLY || "",
  activationYearlyPriceId: process.env.STRIPE_PRICE_ACTIVATION_YEARLY || "",
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
    activationMonthlyPriceId:
      settings?.activationMonthlyPriceId || DEFAULT_BILLING_SETTINGS.activationMonthlyPriceId,
    activationYearlyPriceId:
      settings?.activationYearlyPriceId || DEFAULT_BILLING_SETTINGS.activationYearlyPriceId,
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
