import prisma from "@/lib/db/prisma";
import {
  isPaidBillingStatus,
} from "@/lib/billing/plans";
import {
  getIncludedHorseSlots,
  getPlanDefinition,
  isUnlimitedPlan,
  type BarnPlanKey,
} from "@/lib/billing/catalog";

function hasActiveBillingOverride(seller: {
  adminPlanOverride?: string | null;
  adminBillingCadenceOverride?: string | null;
  adminBillingStatusOverride?: string | null;
  adminBillingOverrideExpiresAt?: Date | null;
}) {
  const hasOverrideValues =
    Boolean(seller.adminPlanOverride) ||
    Boolean(seller.adminBillingCadenceOverride) ||
    Boolean(seller.adminBillingStatusOverride);

  if (!hasOverrideValues) {
    return false;
  }

  if (!seller.adminBillingOverrideExpiresAt) {
    return true;
  }

  return seller.adminBillingOverrideExpiresAt.getTime() > Date.now();
}

export function getEffectiveBarnBillingState(seller: {
  plan: string;
  billingCadence: string;
  billingStatus: string;
  adminPlanOverride?: string | null;
  adminBillingCadenceOverride?: string | null;
  adminBillingStatusOverride?: string | null;
  adminBillingOverrideReason?: string | null;
  adminBillingOverrideExpiresAt?: Date | null;
  trialEndsAt?: Date | null;
  currentPeriodEndsAt?: Date | null;
}) {
  const overrideActive = hasActiveBillingOverride(seller);

  return {
    overrideActive,
    syncedPlan: seller.plan,
    syncedBillingCadence: seller.billingCadence,
    syncedBillingStatus: seller.billingStatus,
    effectivePlan: (overrideActive ? seller.adminPlanOverride : null) || seller.plan,
    effectiveBillingCadence:
      (overrideActive ? seller.adminBillingCadenceOverride : null) || seller.billingCadence,
    effectiveBillingStatus:
      (overrideActive ? seller.adminBillingStatusOverride : null) || seller.billingStatus,
    overrideReason: overrideActive ? seller.adminBillingOverrideReason || null : null,
    overrideExpiresAt: overrideActive ? seller.adminBillingOverrideExpiresAt || null : null,
    trialEndsAt: seller.trialEndsAt || null,
    currentPeriodEndsAt: seller.currentPeriodEndsAt || null,
  };
}

export function isBillingStateCurrentlyActive(seller: {
  plan: string;
  billingCadence: string;
  billingStatus: string;
  adminPlanOverride?: string | null;
  adminBillingCadenceOverride?: string | null;
  adminBillingStatusOverride?: string | null;
  adminBillingOverrideReason?: string | null;
  adminBillingOverrideExpiresAt?: Date | null;
  trialEndsAt?: Date | null;
  currentPeriodEndsAt?: Date | null;
}) {
  const effective = getEffectiveBarnBillingState(seller);
  const trialExpired =
    effective.effectiveBillingStatus === "TRIALING" &&
    Boolean(effective.trialEndsAt && effective.trialEndsAt.getTime() < Date.now());

  return isPaidBillingStatus(effective.effectiveBillingStatus) && !trialExpired;
}

export function isBarnPubliclyVisible(seller: {
  adminDisabledAt?: Date | null;
  plan: string;
  billingCadence: string;
  billingStatus: string;
  adminPlanOverride?: string | null;
  adminBillingCadenceOverride?: string | null;
  adminBillingStatusOverride?: string | null;
  adminBillingOverrideReason?: string | null;
  adminBillingOverrideExpiresAt?: Date | null;
  trialEndsAt?: Date | null;
  currentPeriodEndsAt?: Date | null;
}) {
  if (seller.adminDisabledAt) {
    return false;
  }

  return isBillingStateCurrentlyActive(seller);
}

export function isHorsePubliclyVisible(horse: {
  isPublished: boolean;
  deletedAt?: Date | null;
  adminDisabledAt?: Date | null;
  sellerProfile: {
    adminDisabledAt?: Date | null;
    plan: string;
    billingCadence: string;
    billingStatus: string;
    adminPlanOverride?: string | null;
    adminBillingCadenceOverride?: string | null;
    adminBillingStatusOverride?: string | null;
    adminBillingOverrideReason?: string | null;
    adminBillingOverrideExpiresAt?: Date | null;
    trialEndsAt?: Date | null;
    currentPeriodEndsAt?: Date | null;
  };
}) {
  if (!horse.isPublished || horse.deletedAt || horse.adminDisabledAt) {
    return false;
  }

  if (horse.sellerProfile.adminDisabledAt) {
    return false;
  }

  return isBarnPubliclyVisible(horse.sellerProfile);
}

export async function getBarnUsageSummary(sellerId: string) {
  const [publishedHorseCount, purchasedAggregate, adminAggregate] = await Promise.all([
    prisma.horse.count({
      where: {
        sellerProfileId: sellerId,
        isPublished: true,
        deletedAt: null,
      },
    }),
    prisma.barnHorseSlotLedger.aggregate({
      where: {
        sellerProfileId: sellerId,
        source: "STRIPE_PURCHASE",
      },
      _sum: {
        quantity: true,
      },
    }),
    prisma.barnHorseSlotLedger.aggregate({
      where: {
        sellerProfileId: sellerId,
        source: "ADMIN_ADJUSTMENT",
      },
      _sum: {
        quantity: true,
      },
    }),
  ]);

  const purchasedExtraHorseSlots = purchasedAggregate._sum.quantity ?? 0;
  const adminAdjustedExtraHorseSlots = adminAggregate._sum.quantity ?? 0;
  const totalExtraHorseSlots = Math.max(0, purchasedExtraHorseSlots + adminAdjustedExtraHorseSlots);

  return {
    publishedHorseCount,
    purchasedExtraHorseSlots,
    adminAdjustedExtraHorseSlots,
    totalExtraHorseSlots,
    ownedEquiTagCount: 0,
  };
}

export async function getBarnEntitlements(sellerId: string) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      plan: true,
      billingStatus: true,
      billingCadence: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
      adminPlanOverride: true,
      adminBillingCadenceOverride: true,
      adminBillingStatusOverride: true,
      adminBillingOverrideReason: true,
      adminBillingOverrideExpiresAt: true,
    },
  });

  if (!seller) {
    throw new Error("Barn not found.");
  }

  const usage = await getBarnUsageSummary(seller.id);
  const effective = getEffectiveBarnBillingState(seller);
  const planKey = effective.effectivePlan as BarnPlanKey;
  const planDefinition = getPlanDefinition(planKey);
  const includedHorseSlots = getIncludedHorseSlots(planKey);
  const trialExpired =
    effective.effectiveBillingStatus === "TRIALING" &&
    Boolean(seller.trialEndsAt && seller.trialEndsAt.getTime() < Date.now());
  const billingActive = isPaidBillingStatus(effective.effectiveBillingStatus) && !trialExpired;
  const unlimited = isUnlimitedPlan(planKey);
  const totalHorseCapacity = !billingActive
    ? 0
    : unlimited
      ? null
      : (includedHorseSlots ?? 0) + usage.totalExtraHorseSlots;

  return {
    seller,
    effective,
    usage,
    billingActive,
    trialExpired,
    activation: {
      key: planDefinition.key,
      name: planDefinition.name,
      includedHorseSlots,
      totalHorseCapacity,
      isUnlimited: unlimited && billingActive,
    },
    limits: {
      name: planDefinition.name,
      horseLimit: totalHorseCapacity,
      equiTagLimit: null,
      isUnlimited: unlimited && billingActive,
    },
    canCreateEquiTag: true,
    canPublishMoreHorses:
      billingActive && (unlimited || usage.publishedHorseCount < (totalHorseCapacity ?? 0)),
  };
}

export async function canCreateEquiTagForSeller() {
  return true;
}

export async function canPublishHorseForSeller({
  sellerId,
  excludeHorseId,
}: {
  sellerId: string;
  excludeHorseId?: string;
}) {
  const entitlements = await getBarnEntitlements(sellerId);

  if (!entitlements.billingActive) {
    return false;
  }

  if (entitlements.activation.isUnlimited) {
    return true;
  }

  const publishedCount = await prisma.horse.count({
    where: {
      sellerProfileId: sellerId,
      isPublished: true,
      deletedAt: null,
      ...(excludeHorseId
        ? {
            id: {
              not: excludeHorseId,
            },
          }
        : {}),
    },
  });

  return publishedCount < (entitlements.activation.totalHorseCapacity ?? 0);
}

export function validateHorseForPublishing(horse: {
  name?: string | null;
  age?: number | null;
  height?: string | null;
  location?: string | null;
  description?: string | null;
  image?: string | null;
  breedOptionId?: string | null;
  sexOptionId?: string | null;
  pricingVisibilityOptionId?: string | null;
  primaryDisciplineId?: string | null;
  bestSuitedForIds?: string[] | null;
  horseTypeIds?: string[] | null;
}) {
  const missing: string[] = [];

  if (!horse.name?.trim()) missing.push("name");
  if (!horse.age) missing.push("age");
  if (!horse.height?.trim()) missing.push("height");
  if (!horse.location?.trim()) missing.push("location");
  if (!horse.description?.trim()) missing.push("description");
  if (!horse.image?.trim()) missing.push("main image");
  if (!horse.pricingVisibilityOptionId) missing.push("pricing visibility");
  if (!horse.primaryDisciplineId) missing.push("primary discipline");
  if (!horse.bestSuitedForIds?.length) missing.push("best suited for");
  if (!horse.horseTypeIds?.length) missing.push("horse type");

  return {
    ok: missing.length === 0,
    isPublishReady: missing.length === 0,
    missing,
  };
}
