import { getBillingSettings } from "@/lib/billing/settings";

export type BarnPlanKey = "ACTIVATION";
export type BillingCadenceKey = "MONTHLY" | "YEARLY";
export type BarnBillingStatusKey =
  | "TRIALING"
  | "ACTIVE"
  | "INCOMPLETE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED";

export const ACTIVATION_PLAN = {
  key: "ACTIVATION" as const,
  name: "HorseRoster Program Activation",
  includedHorseSlots: 1,
  description: "Activation includes one active horse and its EquiTag.",
};

export async function getActivationPriceId(cadence: BillingCadenceKey) {
  const settings = await getBillingSettings();
  const priceId =
    cadence === "YEARLY"
      ? settings.activationYearlyPriceId
      : settings.activationMonthlyPriceId;

  if (!priceId) {
    throw new Error(`Missing Stripe activation price ID for ${cadence} in admin billing settings.`);
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

  if (settings.activationMonthlyPriceId === priceId) {
    return {
      kind: "ACTIVATION" as const,
      cadence: "MONTHLY" as const,
    };
  }

  if (settings.activationYearlyPriceId === priceId) {
    return {
      kind: "ACTIVATION" as const,
      cadence: "YEARLY" as const,
    };
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
