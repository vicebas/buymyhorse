import { HorseDivisionContext } from "@/generated/prisma/enums";

export const horseListingInclude = {
  sellerProfile: {
    select: {
      displayName: true,
      slug: true,
      plan: true,
      billingCadence: true,
      billingStatus: true,
      adminPlanOverride: true,
      adminBillingCadenceOverride: true,
      adminBillingStatusOverride: true,
      adminBillingOverrideReason: true,
      adminBillingOverrideExpiresAt: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
      adminDisabledAt: true,
    },
  },
  breedOption: true,
  sexOption: true,
  primaryDiscipline: true,
  pricingVisibilityOption: true,
  saleTypeOption: true,
  colorOption: true,
  importStatusOption: true,
  secondaryDisciplines: {
    include: {
      discipline: true,
    },
  },
  divisionTags: {
    include: {
      divisionOption: {
        include: {
          discipline: true,
        },
      },
    },
  },
  idealRiders: {
    include: {
      idealRiderOption: true,
    },
  },
  horseTypes: {
    include: {
      horseTypeOption: true,
    },
  },
} as const;

export function getHorseBreedLabel(horse: {
  breedOption?: { label: string } | null;
  breed?: string | null;
}) {
  return horse.breedOption?.label || horse.breed || null;
}

export function getHorseSexLabel(horse: {
  sexOption?: { label: string } | null;
  gender?: string | null;
}) {
  return horse.sexOption?.label || horse.gender || null;
}

export function getHorsePrimaryDisciplineLabel(horse: {
  primaryDiscipline?: { label: string } | null;
  discipline?: string | null;
}) {
  return horse.primaryDiscipline?.label || horse.discipline || null;
}

export function getHorseBestSuitedForLabel(horse: {
  level?: string | null;
  divisionTags?: Array<{
    context: HorseDivisionContext;
    divisionOption: { label: string };
  }>;
}) {
  const firstBestSuitedFor = horse.divisionTags?.find(
    (item) => item.context === HorseDivisionContext.BEST_SUITED_FOR
  );

  return firstBestSuitedFor?.divisionOption.label || horse.level || null;
}

export function getHorsePricingVisibilityLabel(horse: {
  pricingVisibilityOption?: { label: string } | null;
}) {
  return horse.pricingVisibilityOption?.label || "Contact for Price";
}

export function mapHorseToCard(horse: {
  id: string;
  name: string;
  age?: number | null;
  height?: string | null;
  image?: string | null;
  location?: string | null;
  saleStatus?: string | null;
  isPlatformFeatured?: boolean;
  sellerProfile: { displayName: string };
  breed?: string | null;
  gender?: string | null;
  discipline?: string | null;
  level?: string | null;
  breedOption?: { label: string } | null;
  sexOption?: { label: string } | null;
  primaryDiscipline?: { label: string } | null;
  pricingVisibilityOption?: { label: string } | null;
  divisionTags?: Array<{
    context: HorseDivisionContext;
    divisionOption: { label: string };
  }>;
}) {
  return {
    id: horse.id,
    name: horse.name,
    breed: getHorseBreedLabel(horse),
    age: horse.age ?? null,
    height: horse.height ?? null,
    gender: getHorseSexLabel(horse),
    discipline: getHorsePrimaryDisciplineLabel(horse),
    level: getHorseBestSuitedForLabel(horse),
    pricingVisibility: getHorsePricingVisibilityLabel(horse),
    image: horse.image ?? null,
    location: horse.location ?? null,
    saleStatus: horse.saleStatus ?? null,
    isPlatformFeatured: Boolean(horse.isPlatformFeatured),
    sellerProfile: {
      displayName: horse.sellerProfile.displayName,
    },
  };
}
