-- CreateEnum
CREATE TYPE "EquiTagAttachmentType" AS ENUM ('HORSE', 'BARN');

-- AlterTable
ALTER TABLE "Horse"
ADD COLUMN "barnDisplayOrder" INTEGER,
ADD COLUMN "isBarnFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SellerProfile"
ADD COLUMN "coverImage" TEXT;

-- CreateTable
CREATE TABLE "EquiTag" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerSellerProfileId" TEXT NOT NULL,
    "attachedEntityType" "EquiTagAttachmentType",
    "attachedBarnId" TEXT,
    "attachedHorseId" TEXT,
    "svgPath" TEXT NOT NULL,
    "pngPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquiTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquiTag_code_key" ON "EquiTag"("code");

-- CreateIndex
CREATE INDEX "EquiTag_ownerSellerProfileId_idx" ON "EquiTag"("ownerSellerProfileId");

-- CreateIndex
CREATE INDEX "EquiTag_attachedEntityType_idx" ON "EquiTag"("attachedEntityType");

-- CreateIndex
CREATE INDEX "EquiTag_attachedBarnId_idx" ON "EquiTag"("attachedBarnId");

-- AddForeignKey
CREATE INDEX "EquiTag_attachedHorseId_idx" ON "EquiTag"("attachedHorseId");

-- AddForeignKey
ALTER TABLE "EquiTag" ADD CONSTRAINT "EquiTag_ownerSellerProfileId_fkey" FOREIGN KEY ("ownerSellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquiTag" ADD CONSTRAINT "EquiTag_attachedBarnId_fkey" FOREIGN KEY ("attachedBarnId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquiTag" ADD CONSTRAINT "EquiTag_attachedHorseId_fkey" FOREIGN KEY ("attachedHorseId") REFERENCES "Horse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
