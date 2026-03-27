import { HorseDivisionContext } from "@/generated/prisma/client";
import { HORSE_DIVISION_CONTEXTS } from "@/lib/horses/listing-option-definitions";

export type HorseListingPayload = {
  name: string;
  age: number | null;
  height: string | null;
  location: string | null;
  description: string | null;
  keyDetails: string | null;
  saleStatus: "FOR_SALE" | "CONSIDERING_OFFERS" | "LEASE" | "SOLD" | "NOT_AVAILABLE";
  isPublished: boolean;
  image: string | null;
  breedOptionId: string | null;
  sexOptionId: string | null;
  primaryDisciplineId: string | null;
  pricingVisibilityOptionId: string | null;
  saleTypeOptionId: string | null;
  colorOptionId: string | null;
  importStatusOptionId: string | null;
  secondaryDisciplineIds: string[];
  bestSuitedForIds: string[];
  currentlyCompetingInIds: string[];
  experiencedThroughIds: string[];
  schoolingThroughIds: string[];
  idealRiderIds: string[];
  horseTypeIds: string[];
  feiPassport: boolean;
  equiVaultAvailable: boolean;
  registrationStatus: string | null;
  showHighlights: string | null;
};

export function buildHorseListingMutation(payload: HorseListingPayload) {
  return {
    name: payload.name,
    age: payload.age,
    height: payload.height,
    location: payload.location,
    description: payload.description,
    keyDetails: payload.keyDetails,
    saleStatus: payload.saleStatus,
    isPublished: payload.isPublished,
    isActive: payload.isPublished,
    image: payload.image,
    breedOptionId: payload.breedOptionId,
    sexOptionId: payload.sexOptionId,
    primaryDisciplineId: payload.primaryDisciplineId,
    pricingVisibilityOptionId: payload.pricingVisibilityOptionId,
    saleTypeOptionId: payload.saleTypeOptionId,
    colorOptionId: payload.colorOptionId,
    importStatusOptionId: payload.importStatusOptionId,
    feiPassport: payload.feiPassport,
    equiVaultAvailable: payload.equiVaultAvailable,
    registrationStatus: payload.registrationStatus,
    showHighlights: payload.showHighlights,
  };
}

export function buildHorseListingRelationWrites(payload: HorseListingPayload) {
  const divisionTags = HORSE_DIVISION_CONTEXTS.flatMap((context) =>
    payload[context.formKey as keyof HorseListingPayload] instanceof Array
      ? (payload[context.formKey as keyof HorseListingPayload] as string[]).map((divisionOptionId) => ({
          divisionOptionId,
          context: context.key,
        }))
      : []
  );

  return {
    secondaryDisciplines: {
      create: payload.secondaryDisciplineIds.map((disciplineId) => ({
        disciplineId,
      })),
    },
    divisionTags: {
      create: divisionTags,
    },
    idealRiders: {
      create: payload.idealRiderIds.map((idealRiderOptionId) => ({
        idealRiderOptionId,
      })),
    },
    horseTypes: {
      create: payload.horseTypeIds.map((horseTypeOptionId) => ({
        horseTypeOptionId,
      })),
    },
  };
}

export function buildHorseListingRelationUpdateWrites(payload: HorseListingPayload) {
  const relationCreates = buildHorseListingRelationWrites(payload);

  return {
    secondaryDisciplines: {
      deleteMany: {},
      create: relationCreates.secondaryDisciplines.create,
    },
    divisionTags: {
      deleteMany: {},
      create: relationCreates.divisionTags.create,
    },
    idealRiders: {
      deleteMany: {},
      create: relationCreates.idealRiders.create,
    },
    horseTypes: {
      deleteMany: {},
      create: relationCreates.horseTypes.create,
    },
  };
}

export function validateHorseListingPayload(payload: HorseListingPayload) {
  const missing: string[] = [];

  if (!payload.name.trim()) missing.push("name");
  if (!payload.age) missing.push("age");
  if (!payload.height?.trim()) missing.push("height");
  if (!payload.location?.trim()) missing.push("location");
  if (!payload.description?.trim()) missing.push("description");
  if (!payload.image?.trim()) missing.push("main image");
  if (!payload.breedOptionId) missing.push("breed");
  if (!payload.sexOptionId) missing.push("sex");
  if (!payload.primaryDisciplineId) missing.push("primary discipline");
  if (!payload.bestSuitedForIds.length) missing.push("best suited for");
  if (!payload.idealRiderIds.length) missing.push("ideal rider");
  if (!payload.horseTypeIds.length) missing.push("horse type / intended use");
  if (!payload.pricingVisibilityOptionId) missing.push("pricing visibility");

  return {
    isPublishReady: missing.length === 0,
    missing,
  };
}

export function getDivisionSelectionsByContext(payload: HorseListingPayload) {
  return new Map<HorseDivisionContext, string[]>([
    [HorseDivisionContext.BEST_SUITED_FOR, payload.bestSuitedForIds],
    [HorseDivisionContext.CURRENTLY_COMPETING_IN, payload.currentlyCompetingInIds],
    [HorseDivisionContext.EXPERIENCED_THROUGH, payload.experiencedThroughIds],
    [HorseDivisionContext.SCHOOLING_THROUGH, payload.schoolingThroughIds],
  ]);
}
