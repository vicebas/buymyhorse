-- CreateTable
CREATE TABLE "EquiTagVisit" (
    "id" TEXT NOT NULL,
    "equiTagId" TEXT NOT NULL,
    "codeSnapshot" TEXT NOT NULL,
    "ownerSellerProfileId" TEXT NOT NULL,
    "attachedEntityType" "EquiTagAttachmentType",
    "attachedBarnId" TEXT,
    "attachedHorseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquiTagVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquiTagVisit_createdAt_idx" ON "EquiTagVisit"("createdAt");

-- CreateIndex
CREATE INDEX "EquiTagVisit_equiTagId_createdAt_idx" ON "EquiTagVisit"("equiTagId", "createdAt");

-- CreateIndex
CREATE INDEX "EquiTagVisit_ownerSellerProfileId_createdAt_idx" ON "EquiTagVisit"("ownerSellerProfileId", "createdAt");

-- AddForeignKey
ALTER TABLE "EquiTagVisit" ADD CONSTRAINT "EquiTagVisit_equiTagId_fkey" FOREIGN KEY ("equiTagId") REFERENCES "EquiTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
