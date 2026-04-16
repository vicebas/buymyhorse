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
  saleTypes: {
    include: {
      saleTypeOption: true,
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

export function getHorseSaleTypeLabels(horse: {
  saleTypes?: Array<{
    saleTypeOption: { label: string; sortOrder?: number };
  }>;
}) {
  return (
    horse.saleTypes
      ?.slice()
      .sort(
        (a, b) =>
          (a.saleTypeOption.sortOrder ?? 0) - (b.saleTypeOption.sortOrder ?? 0) ||
          a.saleTypeOption.label.localeCompare(b.saleTypeOption.label)
      )
      .map((item) => item.saleTypeOption.label) ?? []
  );
}

export function mapHorseToCard(horse: {
  id: string;
  name: string;
  age?: number | null;
  height?: string | null;
  image?: string | null;
  location?: string | null;
  isPlatformFeatured?: boolean;
  sellerProfile: { displayName: string; slug: string };
  breed?: string | null;
  gender?: string | null;
  discipline?: string | null;
  level?: string | null;
  breedOption?: { label: string } | null;
  sexOption?: { label: string } | null;
  primaryDiscipline?: { label: string } | null;
  pricingVisibilityOption?: { label: string } | null;
  saleTypes?: Array<{
    saleTypeOption: { label: string; sortOrder?: number };
  }>;
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
    saleTypes: getHorseSaleTypeLabels(horse),
    image: horse.image ?? null,
    location: horse.location ?? null,
    isPlatformFeatured: Boolean(horse.isPlatformFeatured),
    sellerProfile: {
      displayName: horse.sellerProfile.displayName,
      slug: horse.sellerProfile.slug,
    },
  };
}
