/*
  Warnings:

  - The values [BASIC,PRO,ELITE] on the enum `BarnPlan` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "HorseSlotLedgerSource" AS ENUM ('STRIPE_PURCHASE', 'ADMIN_ADJUSTMENT', 'MIGRATION_SEED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminActionType" ADD VALUE 'BILLING_SETTINGS_UPDATED';
ALTER TYPE "AdminActionType" ADD VALUE 'HORSE_SLOT_ADJUSTED';

-- AlterEnum
BEGIN;
CREATE TYPE "BarnPlan_new" AS ENUM ('ACTIVATION');
ALTER TABLE "public"."SellerProfile" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "SellerProfile" ALTER COLUMN "plan" TYPE "BarnPlan_new" USING ("plan"::text::"BarnPlan_new");
ALTER TABLE "SellerProfile" ALTER COLUMN "adminPlanOverride" TYPE "BarnPlan_new" USING ("adminPlanOverride"::text::"BarnPlan_new");
ALTER TYPE "BarnPlan" RENAME TO "BarnPlan_old";
ALTER TYPE "BarnPlan_new" RENAME TO "BarnPlan";
DROP TYPE "public"."BarnPlan_old";
ALTER TABLE "SellerProfile" ALTER COLUMN "plan" SET DEFAULT 'ACTIVATION';
COMMIT;

-- AlterTable
ALTER TABLE "SellerProfile" ALTER COLUMN "plan" SET DEFAULT 'ACTIVATION';

-- CreateTable
CREATE TABLE "BillingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "activationTrialEnabled" BOOLEAN NOT NULL DEFAULT false,
    "activationTrialDays" INTEGER NOT NULL DEFAULT 7,
    "activationMonthlyPriceId" TEXT,
    "activationYearlyPriceId" TEXT,
    "extraHorsePriceId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarnHorseSlotLedger" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "source" "HorseSlotLedgerSource" NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "adminUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarnHorseSlotLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BarnHorseSlotLedger_stripeCheckoutSessionId_key" ON "BarnHorseSlotLedger"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "BarnHorseSlotLedger_sellerProfileId_createdAt_idx" ON "BarnHorseSlotLedger"("sellerProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "BarnHorseSlotLedger_source_createdAt_idx" ON "BarnHorseSlotLedger"("source", "createdAt");

-- AddForeignKey
ALTER TABLE "BarnHorseSlotLedger" ADD CONSTRAINT "BarnHorseSlotLedger_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
