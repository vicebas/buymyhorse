-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "primaryNotificationEmail" TEXT;

-- CreateTable
CREATE TABLE "SellerContactControl" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerContactControl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerContactControl_sellerProfileId_idx" ON "SellerContactControl"("sellerProfileId");

-- CreateIndex
CREATE INDEX "SellerContactControl_targetUserId_idx" ON "SellerContactControl"("targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerContactControl_sellerProfileId_targetUserId_key" ON "SellerContactControl"("sellerProfileId", "targetUserId");

-- AddForeignKey
ALTER TABLE "SellerContactControl" ADD CONSTRAINT "SellerContactControl_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerContactControl" ADD CONSTRAINT "SellerContactControl_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
