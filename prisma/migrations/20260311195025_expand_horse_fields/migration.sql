-- CreateEnum
CREATE TYPE "HorseSaleStatus" AS ENUM ('FOR_SALE', 'CONSIDERING_OFFERS', 'SOLD', 'LEASE', 'NOT_AVAILABLE');

-- AlterTable
ALTER TABLE "Horse" ADD COLUMN     "height" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "saleStatus" "HorseSaleStatus" NOT NULL DEFAULT 'FOR_SALE';
