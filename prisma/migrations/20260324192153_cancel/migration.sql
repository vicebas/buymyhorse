-- AlterTable
ALTER TABLE "EquiTagOrder" ADD COLUMN     "canceledByAdminAt" TIMESTAMP(3),
ADD COLUMN     "canceledBySellerAt" TIMESTAMP(3);
