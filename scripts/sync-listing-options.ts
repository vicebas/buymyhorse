import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { LISTING_OPTION_DEFAULTS } from "../src/lib/horses/listing-option-definitions";

type DisciplineRecord = {
  label: string;
  sortOrder: number;
  isActive: boolean;
  divisions: DivisionRecord[];
};

type DivisionRecord = {
  label: string;
  sortOrder: number;
  isActive: boolean;
};

type SimpleOptionRecord = {
  label: string;
  sortOrder: number;
  isActive: boolean;
};

type ListingOptionDataset = {
  disciplines: DisciplineRecord[];
  idealRiders: SimpleOptionRecord[];
  horseTypes: SimpleOptionRecord[];
  pricingVisibility: SimpleOptionRecord[];
  saleTypes: SimpleOptionRecord[];
  breeds: SimpleOptionRecord[];
  sexes: SimpleOptionRecord[];
  colors: SimpleOptionRecord[];
  importStatuses: SimpleOptionRecord[];
};

type AppendedDefaults = {
  disciplines: string[];
  divisionsByDiscipline: Record<string, string[]>;
  idealRiders: string[];
  horseTypes: string[];
  pricingVisibility: string[];
  saleTypes: string[];
  breeds: string[];
  sexes: string[];
  colors: string[];
  importStatuses: string[];
};

const SOURCE_DATABASE_URL = mustGetEnv("SOURCE_DATABASE_URL");
const TARGET_DATABASE_URL = mustGetEnv("TARGET_DATABASE_URL");
const shouldApply = process.argv.includes("--apply");
const shouldPrune = !process.argv.includes("--no-prune");

function mustGetEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function createClient(connectionString: string) {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

function compareBySortAndLabel(a: { sortOrder: number; label: string }, b: { sortOrder: number; label: string }) {
  return a.sortOrder - b.sortOrder || a.label.localeCompare(b.label);
}

async function readDataset(prisma: PrismaClient): Promise<ListingOptionDataset> {
  const [
    disciplines,
    idealRiders,
    horseTypes,
    pricingVisibility,
    saleTypes,
    breeds,
    sexes,
    colors,
    importStatuses,
  ] = await Promise.all([
    prisma.disciplineOption.findMany({
      include: {
        divisionOptions: true,
      },
    }),
    prisma.idealRiderOption.findMany(),
    prisma.horseTypeOption.findMany(),
    prisma.pricingVisibilityOption.findMany(),
    prisma.saleTypeOption.findMany(),
    prisma.breedOption.findMany(),
    prisma.sexOption.findMany(),
    prisma.colorOption.findMany(),
    prisma.importStatusOption.findMany(),
  ]);

  return {
    disciplines: disciplines
      .map((discipline) => ({
        label: discipline.label,
        sortOrder: discipline.sortOrder,
        isActive: discipline.isActive,
        divisions: discipline.divisionOptions
          .map((division) => ({
            label: division.label,
            sortOrder: division.sortOrder,
            isActive: division.isActive,
          }))
          .sort(compareBySortAndLabel),
      }))
      .sort(compareBySortAndLabel),
    idealRiders: idealRiders
      .map((option) => ({ label: option.label, sortOrder: option.sortOrder, isActive: option.isActive }))
      .sort(compareBySortAndLabel),
    horseTypes: horseTypes
      .map((option) => ({ label: option.label, sortOrder: option.sortOrder, isActive: option.isActive }))
      .sort(compareBySortAndLabel),
    pricingVisibility: pricingVisibility
      .map((option) => ({ label: option.label, sortOrder: option.sortOrder, isActive: option.isActive }))
      .sort(compareBySortAndLabel),
    saleTypes: saleTypes
      .map((option) => ({ label: option.label, sortOrder: option.sortOrder, isActive: option.isActive }))
      .sort(compareBySortAndLabel),
    breeds: breeds
      .map((option) => ({ label: option.label, sortOrder: option.sortOrder, isActive: option.isActive }))
      .sort(compareBySortAndLabel),
    sexes: sexes
      .map((option) => ({ label: option.label, sortOrder: option.sortOrder, isActive: option.isActive }))
      .sort(compareBySortAndLabel),
    colors: colors
      .map((option) => ({ label: option.label, sortOrder: option.sortOrder, isActive: option.isActive }))
      .sort(compareBySortAndLabel),
    importStatuses: importStatuses
      .map((option) => ({ label: option.label, sortOrder: option.sortOrder, isActive: option.isActive }))
      .sort(compareBySortAndLabel),
  };
}

function appendMissingDefaults(source: ListingOptionDataset) {
  const appended: AppendedDefaults = {
    disciplines: [],
    divisionsByDiscipline: {},
    idealRiders: [],
    horseTypes: [],
    pricingVisibility: [],
    saleTypes: [],
    breeds: [],
    sexes: [],
    colors: [],
    importStatuses: [],
  };

  const disciplineMap = new Map(
    source.disciplines.map((discipline) => [
      discipline.label,
      {
        ...discipline,
        divisions: [...discipline.divisions],
      },
    ])
  );

  LISTING_OPTION_DEFAULTS.disciplines.forEach((label, index) => {
    if (!disciplineMap.has(label)) {
      disciplineMap.set(label, {
        label,
        sortOrder: index,
        isActive: true,
        divisions: [],
      });
      appended.disciplines.push(label);
    }
  });

  for (const [disciplineLabel, defaultDivisionLabels] of Object.entries(LISTING_OPTION_DEFAULTS.divisionsByDiscipline)) {
    const discipline = disciplineMap.get(disciplineLabel);

    if (!discipline) {
      continue;
    }

    const divisionMap = new Map(discipline.divisions.map((division) => [division.label, division]));

    defaultDivisionLabels.forEach((label, index) => {
      if (!divisionMap.has(label)) {
        divisionMap.set(label, {
          label,
          sortOrder: index,
          isActive: true,
        });
        appended.divisionsByDiscipline[disciplineLabel] ||= [];
        appended.divisionsByDiscipline[disciplineLabel].push(label);
      }
    });

    discipline.divisions = Array.from(divisionMap.values()).sort(compareBySortAndLabel);
  }

  const finalized: ListingOptionDataset = {
    disciplines: Array.from(disciplineMap.values()).sort(compareBySortAndLabel),
    idealRiders: mergeSimpleDefaults(source.idealRiders, LISTING_OPTION_DEFAULTS.idealRiders, appended.idealRiders),
    horseTypes: mergeSimpleDefaults(source.horseTypes, LISTING_OPTION_DEFAULTS.horseTypes, appended.horseTypes),
    pricingVisibility: mergeSimpleDefaults(source.pricingVisibility, LISTING_OPTION_DEFAULTS.pricingVisibility, appended.pricingVisibility),
    saleTypes: mergeSimpleDefaults(source.saleTypes, LISTING_OPTION_DEFAULTS.saleTypes, appended.saleTypes),
    breeds: mergeSimpleDefaults(source.breeds, LISTING_OPTION_DEFAULTS.breeds, appended.breeds),
    sexes: mergeSimpleDefaults(source.sexes, LISTING_OPTION_DEFAULTS.sexes, appended.sexes),
    colors: mergeSimpleDefaults(source.colors, LISTING_OPTION_DEFAULTS.colors, appended.colors),
    importStatuses: mergeSimpleDefaults(source.importStatuses, LISTING_OPTION_DEFAULTS.importStatuses, appended.importStatuses),
  };

  return { finalized, appended };
}

function mergeSimpleDefaults(source: SimpleOptionRecord[], defaults: readonly string[], appended: string[]) {
  const optionMap = new Map(
    source.map((option) => [
      option.label,
      {
        ...option,
      },
    ])
  );

  defaults.forEach((label, index) => {
    if (!optionMap.has(label)) {
      optionMap.set(label, {
        label,
        sortOrder: index,
        isActive: true,
      });
      appended.push(label);
    }
  });

  return Array.from(optionMap.values()).sort(compareBySortAndLabel);
}

async function syncDataset(prisma: PrismaClient, dataset: ListingOptionDataset) {
  await prisma.$transaction(async (tx) => {
    for (const discipline of dataset.disciplines) {
      await tx.disciplineOption.upsert({
        where: { label: discipline.label },
        update: {
          sortOrder: discipline.sortOrder,
          isActive: discipline.isActive,
        },
        create: {
          label: discipline.label,
          sortOrder: discipline.sortOrder,
          isActive: discipline.isActive,
        },
      });
    }

    const persistedDisciplines = await tx.disciplineOption.findMany({
      select: {
        id: true,
        label: true,
      },
    });
    const disciplineIdByLabel = new Map(persistedDisciplines.map((discipline) => [discipline.label, discipline.id]));

    for (const discipline of dataset.disciplines) {
      const disciplineId = disciplineIdByLabel.get(discipline.label);

      if (!disciplineId) {
        throw new Error(`Missing persisted discipline for ${discipline.label}.`);
      }

      for (const division of discipline.divisions) {
        await tx.divisionOption.upsert({
          where: {
            disciplineId_label: {
              disciplineId,
              label: division.label,
            },
          },
          update: {
            sortOrder: division.sortOrder,
            isActive: division.isActive,
          },
          create: {
            disciplineId,
            label: division.label,
            sortOrder: division.sortOrder,
            isActive: division.isActive,
          },
        });
      }
    }

    await syncSimpleOptions(tx, "idealRiderOption", dataset.idealRiders);
    await syncSimpleOptions(tx, "horseTypeOption", dataset.horseTypes);
    await syncSimpleOptions(tx, "pricingVisibilityOption", dataset.pricingVisibility);
    await syncSimpleOptions(tx, "saleTypeOption", dataset.saleTypes);
    await syncSimpleOptions(tx, "breedOption", dataset.breeds);
    await syncSimpleOptions(tx, "sexOption", dataset.sexes);
    await syncSimpleOptions(tx, "colorOption", dataset.colors);
    await syncSimpleOptions(tx, "importStatusOption", dataset.importStatuses);

    if (!shouldPrune) {
      return;
    }

    const disciplineLabels = new Set(dataset.disciplines.map((discipline) => discipline.label));
    const persistedWithDivisions = await tx.disciplineOption.findMany({
      include: {
        divisionOptions: true,
      },
    });

    for (const persisted of persistedWithDivisions) {
      const expected = dataset.disciplines.find((discipline) => discipline.label === persisted.label);

      if (!expected) {
        await tx.divisionOption.deleteMany({
          where: { disciplineId: persisted.id },
        });
        await tx.disciplineOption.delete({
          where: { id: persisted.id },
        });
        continue;
      }

      const validDivisionLabels = new Set(expected.divisions.map((division) => division.label));
      const extraDivisionIds = persisted.divisionOptions
        .filter((division) => !validDivisionLabels.has(division.label))
        .map((division) => division.id);

      if (extraDivisionIds.length > 0) {
        await tx.divisionOption.deleteMany({
          where: {
            id: {
              in: extraDivisionIds,
            },
          },
        });
      }
    }

    const extraDisciplineIds = persistedWithDivisions
      .filter((discipline) => !disciplineLabels.has(discipline.label))
      .map((discipline) => discipline.id);

    if (extraDisciplineIds.length > 0) {
      await tx.disciplineOption.deleteMany({
        where: {
          id: {
            in: extraDisciplineIds,
          },
        },
      });
    }

    await pruneSimpleOptions(tx, "idealRiderOption", dataset.idealRiders);
    await pruneSimpleOptions(tx, "horseTypeOption", dataset.horseTypes);
    await pruneSimpleOptions(tx, "pricingVisibilityOption", dataset.pricingVisibility);
    await pruneSimpleOptions(tx, "saleTypeOption", dataset.saleTypes);
    await pruneSimpleOptions(tx, "breedOption", dataset.breeds);
    await pruneSimpleOptions(tx, "sexOption", dataset.sexes);
    await pruneSimpleOptions(tx, "colorOption", dataset.colors);
    await pruneSimpleOptions(tx, "importStatusOption", dataset.importStatuses);
  }, {
    maxWait: 10_000,
    timeout: 60_000,
  });
}

async function syncSimpleOptions(
  tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
  modelName:
    | "idealRiderOption"
    | "horseTypeOption"
    | "pricingVisibilityOption"
    | "saleTypeOption"
    | "breedOption"
    | "sexOption"
    | "colorOption"
    | "importStatusOption",
  options: SimpleOptionRecord[]
) {
  for (const option of options) {
    await tx[modelName].upsert({
      where: { label: option.label },
      update: {
        sortOrder: option.sortOrder,
        isActive: option.isActive,
      },
      create: {
        label: option.label,
        sortOrder: option.sortOrder,
        isActive: option.isActive,
      },
    });
  }
}

async function pruneSimpleOptions(
  tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
  modelName:
    | "idealRiderOption"
    | "horseTypeOption"
    | "pricingVisibilityOption"
    | "saleTypeOption"
    | "breedOption"
    | "sexOption"
    | "colorOption"
    | "importStatusOption",
  options: SimpleOptionRecord[]
) {
  const keepLabels = options.map((option) => option.label);
  await tx[modelName].deleteMany({
    where: {
      label: {
        notIn: keepLabels,
      },
    },
  });
}

function countDataset(dataset: ListingOptionDataset) {
  return {
    DisciplineOption: dataset.disciplines.length,
    DivisionOption: dataset.disciplines.reduce((total, discipline) => total + discipline.divisions.length, 0),
    IdealRiderOption: dataset.idealRiders.length,
    HorseTypeOption: dataset.horseTypes.length,
    PricingVisibilityOption: dataset.pricingVisibility.length,
    SaleTypeOption: dataset.saleTypes.length,
    BreedOption: dataset.breeds.length,
    SexOption: dataset.sexes.length,
    ColorOption: dataset.colors.length,
    ImportStatusOption: dataset.importStatuses.length,
  };
}

async function main() {
  const source = createClient(SOURCE_DATABASE_URL);
  const target = createClient(TARGET_DATABASE_URL);

  try {
    const sourceDataset = await readDataset(source);
    const { finalized, appended } = appendMissingDefaults(sourceDataset);

    console.log(JSON.stringify({
      mode: shouldApply ? "apply" : "dry-run",
      prune: shouldPrune,
      sourceCounts: countDataset(sourceDataset),
      finalizedCounts: countDataset(finalized),
      appendedDefaults: appended,
    }, null, 2));

    if (!shouldApply) {
      return;
    }

    await syncDataset(target, finalized);

    const targetDataset = await readDataset(target);
    const targetCounts = countDataset(targetDataset);
    const finalizedCounts = countDataset(finalized);

    if (JSON.stringify(targetCounts) !== JSON.stringify(finalizedCounts)) {
      throw new Error(`Target counts do not match finalized dataset. Target: ${JSON.stringify(targetCounts)} Finalized: ${JSON.stringify(finalizedCounts)}`);
    }

    console.log(JSON.stringify({
      status: "ok",
      targetCounts,
    }, null, 2));
  } finally {
    await Promise.all([
      source.$disconnect(),
      target.$disconnect(),
    ]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
