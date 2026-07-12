import { getBillingSettings } from "@/lib/billing/settings";
import {
  BILLING_PLANS,
  getPlanCadence,
  type BarnPlanKey,
} from "@/lib/billing/catalog";

export type BarnBillingStatusKey =
  | "TRIALING"
  | "ACTIVE"
  | "INCOMPLETE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED";

export async function getPlanPriceId(planKey: BarnPlanKey) {
  const settings = await getBillingSettings();

  const priceIdByPlan: Record<BarnPlanKey, string> = {
    SINGLE_HORSE: settings.singleHorsePriceId,
    BARN_STARTER: settings.barnStarterPriceId,
    BARN_GROWTH: settings.barnGrowthPriceId,
    BARN_UNLIMITED: settings.barnUnlimitedPriceId,
  };

  const priceId = priceIdByPlan[planKey];

  if (!priceId) {
    throw new Error(`Missing Stripe price ID for ${BILLING_PLANS[planKey].name} in admin billing settings.`);
  }

  return priceId;
}

export async function getExtraHorsePriceId() {
  const settings = await getBillingSettings();
  const priceId = settings.extraHorsePriceId;

  if (!priceId) {
    throw new Error("Missing Stripe price ID for extra horse purchases in admin billing settings.");
  }

  return priceId;
}

export async function getBillingProductFromPriceId(priceId?: string | null) {
  if (!priceId) {
    return null;
  }

  const settings = await getBillingSettings();

  const recurringPriceByPlan: Array<[BarnPlanKey, string]> = [
    ["SINGLE_HORSE", settings.singleHorsePriceId],
    ["BARN_STARTER", settings.barnStarterPriceId],
    ["BARN_GROWTH", settings.barnGrowthPriceId],
    ["BARN_UNLIMITED", settings.barnUnlimitedPriceId],
  ];

  for (const [planKey, configuredPriceId] of recurringPriceByPlan) {
    if (configuredPriceId === priceId) {
      return {
        kind: "PLAN" as const,
        planKey,
        cadence: getPlanCadence(planKey),
      };
    }
  }

  if (settings.extraHorsePriceId === priceId) {
    return {
      kind: "EXTRA_HORSE" as const,
    };
  }

  return null;
}

export function isPaidBillingStatus(status?: string | null) {
  return status === "ACTIVE" || status === "TRIALING";
}
