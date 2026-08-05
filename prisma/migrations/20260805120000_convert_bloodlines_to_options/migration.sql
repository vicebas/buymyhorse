CREATE TABLE "SireOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SireOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DamOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DamOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DamSireOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DamSireOption_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Horse"
ADD COLUMN "sireOptionId" TEXT,
ADD COLUMN "damOptionId" TEXT,
ADD COLUMN "damSireOptionId" TEXT;

CREATE UNIQUE INDEX "SireOption_label_key" ON "SireOption"("label");
CREATE UNIQUE INDEX "DamOption_label_key" ON "DamOption"("label");
CREATE UNIQUE INDEX "DamSireOption_label_key" ON "DamSireOption"("label");

CREATE INDEX "Horse_sireOptionId_idx" ON "Horse"("sireOptionId");
CREATE INDEX "Horse_damOptionId_idx" ON "Horse"("damOptionId");
CREATE INDEX "Horse_damSireOptionId_idx" ON "Horse"("damSireOptionId");

ALTER TABLE "Horse" ADD CONSTRAINT "Horse_sireOptionId_fkey" FOREIGN KEY ("sireOptionId") REFERENCES "SireOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_damOptionId_fkey" FOREIGN KEY ("damOptionId") REFERENCES "DamOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_damSireOptionId_fkey" FOREIGN KEY ("damSireOptionId") REFERENCES "DamSireOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Horse"
DROP COLUMN "sire",
DROP COLUMN "dam",
DROP COLUMN "damSire";
