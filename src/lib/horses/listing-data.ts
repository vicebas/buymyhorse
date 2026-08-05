import { HorseDivisionContext } from "@/generated/prisma/enums";

export const horseListingInclude = {
  sellerProfile: {
    select: {
      displayName: true,
      slug: true,
      adminDisabledAt: true,
    },
  },
  breedOption: true,
  sexOption: true,
  primaryDiscipline: true,
  pricingVisibilityOption: true,
  colorOption: true,
  importStatusOption: true,
  sireOption: true,
  damOption: true,
  damSireOption: true,
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

export function isHorseListingAvailable(horse: {
  isPublished: boolean;
  deletedAt?: Date | null;
  adminDisabledAt?: Date | null;
  sellerProfile: { adminDisabledAt?: Date | null };
}) {
  return (
    horse.isPublished &&
    !horse.deletedAt &&
    !horse.adminDisabledAt &&
    !horse.sellerProfile.adminDisabledAt
  );
}

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

export function getHorseSireLabel(horse: {
  sireOption?: { label: string } | null;
}) {
  return horse.sireOption?.label || null;
}

export function getHorseDamLabel(horse: {
  damOption?: { label: string } | null;
}) {
  return horse.damOption?.label || null;
}

export function getHorseDamSireLabel(horse: {
  damSireOption?: { label: string } | null;
}) {
  return horse.damSireOption?.label || null;
}

export function getHorseDivisionLabelsByContext(horse: {
  divisionTags?: Array<{
    context: HorseDivisionContext;
    divisionOption: { label: string; sortOrder?: number };
  }>;
}, context: HorseDivisionContext) {
  return (
    horse.divisionTags
      ?.filter((item) => item.context === context)
      .slice()
      .sort(
        (a, b) =>
          (a.divisionOption.sortOrder ?? 0) - (b.divisionOption.sortOrder ?? 0) ||
          a.divisionOption.label.localeCompare(b.divisionOption.label)
      )
      .map((item) => item.divisionOption.label) ?? []
  );
}

export function getHorseTypeLabels(horse: {
  horseTypes?: Array<{
    horseTypeOption: { label: string; sortOrder?: number };
  }>;
}) {
  return (
    horse.horseTypes
      ?.slice()
      .sort(
        (a, b) =>
          (a.horseTypeOption.sortOrder ?? 0) - (b.horseTypeOption.sortOrder ?? 0) ||
          a.horseTypeOption.label.localeCompare(b.horseTypeOption.label)
      )
      .map((item) => item.horseTypeOption.label) ?? []
  );
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
