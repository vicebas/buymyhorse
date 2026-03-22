-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('BARN_DISABLED', 'BARN_RESTORED', 'HORSE_DISABLED', 'HORSE_RESTORED', 'BILLING_OVERRIDE_SET', 'BILLING_OVERRIDE_CLEARED', 'USER_ROLE_CHANGED');

-- CreateEnum
CREATE TYPE "AdminActionTargetType" AS ENUM ('BARN', 'HORSE', 'BILLING', 'USER');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "Horse" ADD COLUMN     "adminDisableReason" TEXT,
ADD COLUMN     "adminDisabledAt" TIMESTAMP(3),
ADD COLUMN     "adminDisabledByUserId" TEXT;

-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN     "adminBillingCadenceOverride" "BillingCadence",
ADD COLUMN     "adminBillingOverrideExpiresAt" TIMESTAMP(3),
ADD COLUMN     "adminBillingOverrideReason" TEXT,
ADD COLUMN     "adminBillingOverrideUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "adminBillingOverrideUpdatedByUserId" TEXT,
ADD COLUMN     "adminBillingStatusOverride" "BarnBillingStatus",
ADD COLUMN     "adminDisableReason" TEXT,
ADD COLUMN     "adminDisabledAt" TIMESTAMP(3),
ADD COLUMN     "adminDisabledByUserId" TEXT,
ADD COLUMN     "adminPlanOverride" "BarnPlan";

-- CreateTable
CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actionType" "AdminActionType" NOT NULL,
    "targetType" "AdminActionTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminActionLog_actorUserId_createdAt_idx" ON "AdminActionLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_targetType_targetId_createdAt_idx" ON "AdminActionLog"("targetType", "targetId", "createdAt");

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_adminDisabledByUserId_fkey" FOREIGN KEY ("adminDisabledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_adminBillingOverrideUpdatedByUserId_fkey" FOREIGN KEY ("adminBillingOverrideUpdatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_adminDisabledByUserId_fkey" FOREIGN KEY ("adminDisabledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActionLog" ADD CONSTRAINT "AdminActionLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
