-- CreateEnum
CREATE TYPE "HorseDivisionContext" AS ENUM ('BEST_SUITED_FOR', 'CURRENTLY_COMPETING_IN', 'EXPERIENCED_THROUGH', 'SCHOOLING_THROUGH');

-- AlterEnum
ALTER TYPE "AdminActionTargetType" ADD VALUE 'LISTING_OPTION';

-- AlterEnum
ALTER TYPE "AdminActionType" ADD VALUE 'LISTING_OPTIONS_UPDATED';

-- AlterTable
ALTER TABLE "Horse" ADD COLUMN     "breedOptionId" TEXT,
ADD COLUMN     "colorOptionId" TEXT,
ADD COLUMN     "equiVaultAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "feiPassport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "importStatusOptionId" TEXT,
ADD COLUMN     "pricingVisibilityOptionId" TEXT,
ADD COLUMN     "primaryDisciplineId" TEXT,
ADD COLUMN     "registrationStatus" TEXT,
ADD COLUMN     "saleTypeOptionId" TEXT,
ADD COLUMN     "sexOptionId" TEXT,
ADD COLUMN     "showHighlights" TEXT;

-- CreateTable
CREATE TABLE "DisciplineOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplineOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DivisionOption" (
    "id" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DivisionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdealRiderOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdealRiderOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorseTypeOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HorseTypeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingVisibilityOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingVisibilityOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleTypeOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleTypeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreedOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreedOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SexOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SexOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColorOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportStatusOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportStatusOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorseSecondaryDiscipline" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HorseSecondaryDiscipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorseDivisionTag" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "divisionOptionId" TEXT NOT NULL,
    "context" "HorseDivisionContext" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HorseDivisionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorseIdealRider" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "idealRiderOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HorseIdealRider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorseTypeSelection" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "horseTypeOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HorseTypeSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DisciplineOption_label_key" ON "DisciplineOption"("label");

-- CreateIndex
CREATE INDEX "DivisionOption_disciplineId_sortOrder_idx" ON "DivisionOption"("disciplineId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DivisionOption_disciplineId_label_key" ON "DivisionOption"("disciplineId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "IdealRiderOption_label_key" ON "IdealRiderOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "HorseTypeOption_label_key" ON "HorseTypeOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "PricingVisibilityOption_label_key" ON "PricingVisibilityOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "SaleTypeOption_label_key" ON "SaleTypeOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "BreedOption_label_key" ON "BreedOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "SexOption_label_key" ON "SexOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "ColorOption_label_key" ON "ColorOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "ImportStatusOption_label_key" ON "ImportStatusOption"("label");

-- CreateIndex
CREATE INDEX "HorseSecondaryDiscipline_disciplineId_idx" ON "HorseSecondaryDiscipline"("disciplineId");

-- CreateIndex
CREATE UNIQUE INDEX "HorseSecondaryDiscipline_horseId_disciplineId_key" ON "HorseSecondaryDiscipline"("horseId", "disciplineId");

-- CreateIndex
CREATE INDEX "HorseDivisionTag_divisionOptionId_context_idx" ON "HorseDivisionTag"("divisionOptionId", "context");

-- CreateIndex
CREATE UNIQUE INDEX "HorseDivisionTag_horseId_divisionOptionId_context_key" ON "HorseDivisionTag"("horseId", "divisionOptionId", "context");

-- CreateIndex
CREATE INDEX "HorseIdealRider_idealRiderOptionId_idx" ON "HorseIdealRider"("idealRiderOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "HorseIdealRider_horseId_idealRiderOptionId_key" ON "HorseIdealRider"("horseId", "idealRiderOptionId");

-- CreateIndex
CREATE INDEX "HorseTypeSelection_horseTypeOptionId_idx" ON "HorseTypeSelection"("horseTypeOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "HorseTypeSelection_horseId_horseTypeOptionId_key" ON "HorseTypeSelection"("horseId", "horseTypeOptionId");

-- CreateIndex
CREATE INDEX "Horse_breedOptionId_idx" ON "Horse"("breedOptionId");

-- CreateIndex
CREATE INDEX "Horse_sexOptionId_idx" ON "Horse"("sexOptionId");

-- CreateIndex
CREATE INDEX "Horse_primaryDisciplineId_idx" ON "Horse"("primaryDisciplineId");

-- CreateIndex
CREATE INDEX "Horse_pricingVisibilityOptionId_idx" ON "Horse"("pricingVisibilityOptionId");

-- CreateIndex
CREATE INDEX "Horse_saleTypeOptionId_idx" ON "Horse"("saleTypeOptionId");

-- CreateIndex
CREATE INDEX "Horse_colorOptionId_idx" ON "Horse"("colorOptionId");

-- CreateIndex
CREATE INDEX "Horse_importStatusOptionId_idx" ON "Horse"("importStatusOptionId");

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_breedOptionId_fkey" FOREIGN KEY ("breedOptionId") REFERENCES "BreedOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_sexOptionId_fkey" FOREIGN KEY ("sexOptionId") REFERENCES "SexOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_primaryDisciplineId_fkey" FOREIGN KEY ("primaryDisciplineId") REFERENCES "DisciplineOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_pricingVisibilityOptionId_fkey" FOREIGN KEY ("pricingVisibilityOptionId") REFERENCES "PricingVisibilityOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_saleTypeOptionId_fkey" FOREIGN KEY ("saleTypeOptionId") REFERENCES "SaleTypeOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_colorOptionId_fkey" FOREIGN KEY ("colorOptionId") REFERENCES "ColorOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_importStatusOptionId_fkey" FOREIGN KEY ("importStatusOptionId") REFERENCES "ImportStatusOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionOption" ADD CONSTRAINT "DivisionOption_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "DisciplineOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorseSecondaryDiscipline" ADD CONSTRAINT "HorseSecondaryDiscipline_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorseSecondaryDiscipline" ADD CONSTRAINT "HorseSecondaryDiscipline_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "DisciplineOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorseDivisionTag" ADD CONSTRAINT "HorseDivisionTag_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorseDivisionTag" ADD CONSTRAINT "HorseDivisionTag_divisionOptionId_fkey" FOREIGN KEY ("divisionOptionId") REFERENCES "DivisionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorseIdealRider" ADD CONSTRAINT "HorseIdealRider_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorseIdealRider" ADD CONSTRAINT "HorseIdealRider_idealRiderOptionId_fkey" FOREIGN KEY ("idealRiderOptionId") REFERENCES "IdealRiderOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorseTypeSelection" ADD CONSTRAINT "HorseTypeSelection_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorseTypeSelection" ADD CONSTRAINT "HorseTypeSelection_horseTypeOptionId_fkey" FOREIGN KEY ("horseTypeOptionId") REFERENCES "HorseTypeOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
