-- CreateEnum
CREATE TYPE "EquiTagOrderStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'PRINTING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "BillingSettings" ADD COLUMN     "equitagMaxBatchQuantity" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "equitagPhysicalPriceId" TEXT;

-- CreateTable
CREATE TABLE "EquiTagOrder" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "equiTagId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "EquiTagOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "deliveryCompany" TEXT,
    "trackingCode" TEXT,
    "shippingName" TEXT,
    "shippingAddressLine1" TEXT,
    "shippingAddressLine2" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingPostalCode" TEXT,
    "shippingCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquiTagOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquiTagOrder_stripeCheckoutSessionId_key" ON "EquiTagOrder"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "EquiTagOrder_sellerProfileId_createdAt_idx" ON "EquiTagOrder"("sellerProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "EquiTagOrder_status_createdAt_idx" ON "EquiTagOrder"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "EquiTagOrder" ADD CONSTRAINT "EquiTagOrder_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquiTagOrder" ADD CONSTRAINT "EquiTagOrder_equiTagId_fkey" FOREIGN KEY ("equiTagId") REFERENCES "EquiTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
