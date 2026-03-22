/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `SellerProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `SellerProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BarnPlan" AS ENUM ('BASIC', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "BillingCadence" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "BarnBillingStatus" AS ENUM ('TRIALING', 'ACTIVE', 'INCOMPLETE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN     "billingCadence" "BillingCadence" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "billingStatus" "BarnBillingStatus" NOT NULL DEFAULT 'TRIALING',
ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "currentPeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "plan" "BarnPlan" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_stripeCustomerId_key" ON "SellerProfile"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_stripeSubscriptionId_key" ON "SellerProfile"("stripeSubscriptionId");
