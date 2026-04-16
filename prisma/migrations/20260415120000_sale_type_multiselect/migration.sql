CREATE TABLE "HorseSaleTypeSelection" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "saleTypeOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HorseSaleTypeSelection_pkey" PRIMARY KEY ("id")
);

INSERT INTO "HorseSaleTypeSelection" ("id", "horseId", "saleTypeOptionId", "createdAt")
SELECT
    md5("id" || ':' || "saleTypeOptionId" || ':' || clock_timestamp()::text || ':' || random()::text),
    "id",
    "saleTypeOptionId",
    CURRENT_TIMESTAMP
FROM "Horse"
WHERE "saleTypeOptionId" IS NOT NULL;

CREATE UNIQUE INDEX "HorseSaleTypeSelection_horseId_saleTypeOptionId_key" ON "HorseSaleTypeSelection"("horseId", "saleTypeOptionId");
CREATE INDEX "HorseSaleTypeSelection_saleTypeOptionId_idx" ON "HorseSaleTypeSelection"("saleTypeOptionId");

ALTER TABLE "HorseSaleTypeSelection"
ADD CONSTRAINT "HorseSaleTypeSelection_horseId_fkey"
FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HorseSaleTypeSelection"
ADD CONSTRAINT "HorseSaleTypeSelection_saleTypeOptionId_fkey"
FOREIGN KEY ("saleTypeOptionId") REFERENCES "SaleTypeOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Horse" DROP CONSTRAINT "Horse_saleTypeOptionId_fkey";
DROP INDEX "Horse_saleTypeOptionId_idx";
ALTER TABLE "Horse" DROP COLUMN "saleTypeOptionId";
