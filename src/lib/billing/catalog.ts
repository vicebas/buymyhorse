export type BarnPlanKey =
  | "SINGLE_HORSE"
  | "BARN_STARTER"
  | "BARN_GROWTH"
  | "BARN_UNLIMITED";
export type BillingCadenceKey = "MONTHLY" | "SEMIANNUAL";

export type BillingPlanDefinition = {
  key: BarnPlanKey;
  name: string;
  checkoutLabel: string;
  description: string;
  priceLabel: string;
  intervalLabel: string;
  cadence: BillingCadenceKey;
  includedHorseSlots: number | null;
};

export const BILLING_PLANS: Record<BarnPlanKey, BillingPlanDefinition> = {
  SINGLE_HORSE: {
    key: "SINGLE_HORSE",
    name: "Single Horse",
    checkoutLabel: "Single Horse",
    description: "Best for a single active listing with room to add one-time extra capacity later.",
    priceLabel: "$9",
    intervalLabel: "/ 6 months",
    cadence: "SEMIANNUAL",
    includedHorseSlots: 1,
  },
  BARN_STARTER: {
    key: "BARN_STARTER",
    name: "Barn Starter",
    checkoutLabel: "Barn Starter",
    description: "Built for small sales rosters with five active horses included.",
    priceLabel: "$19",
    intervalLabel: "/ month",
    cadence: "MONTHLY",
    includedHorseSlots: 5,
  },
  BARN_GROWTH: {
    key: "BARN_GROWTH",
    name: "Barn Growth",
    checkoutLabel: "Barn Growth",
    description: "For active programs managing up to twenty public horses at once.",
    priceLabel: "$49",
    intervalLabel: "/ month",
    cadence: "MONTHLY",
    includedHorseSlots: 20,
  },
  BARN_UNLIMITED: {
    key: "BARN_UNLIMITED",
    name: "Barn Unlimited",
    checkoutLabel: "Barn Unlimited",
    description: "Unlimited active horse listings with no publish cap.",
    priceLabel: "$89",
    intervalLabel: "/ month",
    cadence: "MONTHLY",
    includedHorseSlots: null,
  },
};

export const BILLING_PLAN_ORDER: BarnPlanKey[] = [
  "SINGLE_HORSE",
  "BARN_STARTER",
  "BARN_GROWTH",
  "BARN_UNLIMITED",
];

export function getPlanDefinition(planKey: BarnPlanKey) {
  return BILLING_PLANS[planKey];
}

export function getIncludedHorseSlots(planKey: BarnPlanKey) {
  return BILLING_PLANS[planKey].includedHorseSlots;
}

export function isUnlimitedPlan(planKey: BarnPlanKey) {
  return BILLING_PLANS[planKey].includedHorseSlots === null;
}

export function getPlanCadence(planKey: BarnPlanKey): BillingCadenceKey {
  return BILLING_PLANS[planKey].cadence;
}
