ALTER TYPE "BarnPlan" RENAME VALUE 'ACTIVATION' TO 'SINGLE_HORSE';
ALTER TYPE "BarnPlan" ADD VALUE 'BARN_STARTER';
ALTER TYPE "BarnPlan" ADD VALUE 'BARN_GROWTH';
ALTER TYPE "BarnPlan" ADD VALUE 'BARN_UNLIMITED';

ALTER TYPE "BillingCadence" RENAME VALUE 'YEARLY' TO 'SEMIANNUAL';

ALTER TABLE "SellerProfile"
  ALTER COLUMN "plan" SET DEFAULT 'SINGLE_HORSE',
  ALTER COLUMN "billingCadence" SET DEFAULT 'SEMIANNUAL';

ALTER TABLE "BillingSettings"
  ADD COLUMN "singleHorsePriceId" TEXT,
  ADD COLUMN "barnStarterPriceId" TEXT,
  ADD COLUMN "barnGrowthPriceId" TEXT,
  ADD COLUMN "barnUnlimitedPriceId" TEXT;

UPDATE "BillingSettings"
SET "barnStarterPriceId" = "activationMonthlyPriceId"
WHERE "activationMonthlyPriceId" IS NOT NULL;

ALTER TABLE "BillingSettings"
  DROP COLUMN "activationMonthlyPriceId",
  DROP COLUMN "activationYearlyPriceId";
