import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { seedListingOptions } from "../src/lib/horses/listing-options";
import { HorseDivisionContext } from "../src/generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function pickRandomId(list: Array<{ id: string }>) {
  return list[Math.floor(Math.random() * list.length)]?.id || null;
}

function pickRandomIds(list: Array<{ id: string }>, min = 1, max = 2) {
  const copy = [...list];
  const targetCount = Math.min(copy.length, Math.max(min, Math.floor(Math.random() * max) + 1));
  const result: string[] = [];

  while (copy.length > 0 && result.length < targetCount) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0].id);
  }

  return result;
}

async function main() {
  await seedListingOptions();

  const [
    horses,
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
    prisma.horse.findMany({
      select: {
        id: true,
      },
    }),
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

  for (const horse of horses) {
    const primaryDiscipline = disciplines[Math.floor(Math.random() * disciplines.length)];
    const secondaryDisciplines = disciplines
      .filter((discipline) => discipline.id !== primaryDiscipline?.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const availableDivisionOptions = [
      ...(primaryDiscipline?.divisionOptions || []),
      ...secondaryDisciplines.flatMap((discipline) => discipline.divisionOptions),
    ];

    await prisma.horse.update({
      where: { id: horse.id },
      data: {
        breedOptionId: pickRandomId(breeds),
        sexOptionId: pickRandomId(sexes),
        primaryDisciplineId: primaryDiscipline?.id || null,
        pricingVisibilityOptionId: pickRandomId(pricingVisibility),
        saleTypeOptionId: pickRandomId(saleTypes),
        colorOptionId: pickRandomId(colors),
        importStatusOptionId: pickRandomId(importStatuses),
        feiPassport: Math.random() > 0.5,
        equiVaultAvailable: Math.random() > 0.5,
        secondaryDisciplines: {
          deleteMany: {},
          create: secondaryDisciplines.map((discipline) => ({
            disciplineId: discipline.id,
          })),
        },
        idealRiders: {
          deleteMany: {},
          create: pickRandomIds(idealRiders, 1, 3).map((idealRiderOptionId) => ({
            idealRiderOptionId,
          })),
        },
        horseTypes: {
          deleteMany: {},
          create: pickRandomIds(horseTypes, 1, 3).map((horseTypeOptionId) => ({
            horseTypeOptionId,
          })),
        },
        divisionTags: {
          deleteMany: {},
          create: [
            ...pickRandomIds(availableDivisionOptions, 1, 3).map((divisionOptionId) => ({
              divisionOptionId,
              context: HorseDivisionContext.BEST_SUITED_FOR,
            })),
            ...pickRandomIds(availableDivisionOptions, 0, 2).map((divisionOptionId) => ({
              divisionOptionId,
              context: HorseDivisionContext.CURRENTLY_COMPETING_IN,
            })),
            ...pickRandomIds(availableDivisionOptions, 0, 2).map((divisionOptionId) => ({
              divisionOptionId,
              context: HorseDivisionContext.EXPERIENCED_THROUGH,
            })),
            ...pickRandomIds(availableDivisionOptions, 0, 2).map((divisionOptionId) => ({
              divisionOptionId,
              context: HorseDivisionContext.SCHOOLING_THROUGH,
            })),
          ],
        },
      },
    });
  }

  console.log(`Backfilled ${horses.length} horses with randomized listing taxonomy selections.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
