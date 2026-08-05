import prisma from "@/lib/db/prisma";
import { LISTING_OPTION_DEFAULTS } from "@/lib/horses/listing-option-definitions";

export { HORSE_DIVISION_CONTEXTS, LISTING_OPTION_DEFAULTS, LISTING_OPTION_LABELS, parseStringList } from "@/lib/horses/listing-option-definitions";

export async function getListingOptionsForAdmin() {
  const [
    disciplines,
    idealRiders,
    horseTypes,
    pricingVisibility,
    saleTypes,
    breeds,
    sires,
    dams,
    damSires,
    sexes,
    colors,
    importStatuses,
  ] = await Promise.all([
    prisma.disciplineOption.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      include: {
        divisionOptions: {
          orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        },
      },
    }),
    prisma.idealRiderOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.horseTypeOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.pricingVisibilityOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.saleTypeOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.breedOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.sireOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.damOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.damSireOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.sexOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.colorOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    prisma.importStatusOption.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
  ]);

  return {
    disciplines,
    idealRiders,
    horseTypes,
    pricingVisibility,
    saleTypes,
    breeds,
    sires,
    dams,
    damSires,
    sexes,
    colors,
    importStatuses,
  };
}

export async function getActiveListingOptions() {
  const data = await getListingOptionsForAdmin();

  return {
    disciplines: data.disciplines
      .filter((discipline) => discipline.isActive)
      .map((discipline) => ({
        ...discipline,
        divisionOptions: discipline.divisionOptions.filter((division) => division.isActive),
      })),
    idealRiders: data.idealRiders.filter((option) => option.isActive),
    horseTypes: data.horseTypes.filter((option) => option.isActive),
    pricingVisibility: data.pricingVisibility.filter((option) => option.isActive),
    saleTypes: data.saleTypes.filter((option) => option.isActive),
    breeds: data.breeds.filter((option) => option.isActive),
    sires: data.sires.filter((option) => option.isActive),
    dams: data.dams.filter((option) => option.isActive),
    damSires: data.damSires.filter((option) => option.isActive),
    sexes: data.sexes.filter((option) => option.isActive),
    colors: data.colors.filter((option) => option.isActive),
    importStatuses: data.importStatuses.filter((option) => option.isActive),
  };
}

export async function seedListingOptions() {
  for (const [index, label] of LISTING_OPTION_DEFAULTS.disciplines.entries()) {
    await prisma.disciplineOption.upsert({
      where: { label },
      update: { sortOrder: index },
      create: { label, sortOrder: index },
    });
  }

  const disciplines = await prisma.disciplineOption.findMany();
  const disciplineMap = new Map(disciplines.map((item) => [item.label, item.id]));

  for (const [disciplineLabel, divisionLabels] of Object.entries(LISTING_OPTION_DEFAULTS.divisionsByDiscipline)) {
    const disciplineId = disciplineMap.get(disciplineLabel);
    if (!disciplineId) continue;

    for (const [index, label] of divisionLabels.entries()) {
      await prisma.divisionOption.upsert({
        where: {
          disciplineId_label: {
            disciplineId,
            label,
          },
        },
        update: { sortOrder: index },
        create: {
          disciplineId,
          label,
          sortOrder: index,
        },
      });
    }
  }

  await upsertSimpleOptions("idealRiderOption", LISTING_OPTION_DEFAULTS.idealRiders);
  await upsertSimpleOptions("horseTypeOption", LISTING_OPTION_DEFAULTS.horseTypes);
  await upsertSimpleOptions("pricingVisibilityOption", LISTING_OPTION_DEFAULTS.pricingVisibility);
  await upsertSimpleOptions("saleTypeOption", LISTING_OPTION_DEFAULTS.saleTypes);
  await upsertSimpleOptions("breedOption", LISTING_OPTION_DEFAULTS.breeds);
  await upsertSimpleOptions("sireOption", []);
  await upsertSimpleOptions("damOption", []);
  await upsertSimpleOptions("damSireOption", []);
  await upsertSimpleOptions("sexOption", LISTING_OPTION_DEFAULTS.sexes);
  await upsertSimpleOptions("colorOption", LISTING_OPTION_DEFAULTS.colors);
  await upsertSimpleOptions("importStatusOption", LISTING_OPTION_DEFAULTS.importStatuses);
}

async function upsertSimpleOptions(
  modelName:
    | "idealRiderOption"
    | "horseTypeOption"
    | "pricingVisibilityOption"
    | "saleTypeOption"
    | "breedOption"
    | "sireOption"
    | "damOption"
    | "damSireOption"
    | "sexOption"
    | "colorOption"
    | "importStatusOption",
  labels: readonly string[]
) {
  for (const [index, label] of labels.entries()) {
    switch (modelName) {
      case "idealRiderOption":
        await prisma.idealRiderOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "horseTypeOption":
        await prisma.horseTypeOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "pricingVisibilityOption":
        await prisma.pricingVisibilityOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "saleTypeOption":
        await prisma.saleTypeOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "breedOption":
        await prisma.breedOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "sireOption":
        await prisma.sireOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "damOption":
        await prisma.damOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "damSireOption":
        await prisma.damSireOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "sexOption":
        await prisma.sexOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "colorOption":
        await prisma.colorOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
      case "importStatusOption":
        await prisma.importStatusOption.upsert({
          where: { label },
          update: { sortOrder: index },
          create: { label, sortOrder: index },
        });
        break;
    }
  }
}
