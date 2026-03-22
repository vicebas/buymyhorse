-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_HORSE_FROM_FOLLOWED_BARN', 'HORSE_UPDATED_FROM_FOLLOWED_BARN', 'NEW_MESSAGE');

-- CreateTable
CREATE TABLE "BarnFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarnFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "systemNewHorseFromFollowedBarn" BOOLEAN NOT NULL DEFAULT true,
    "systemHorseUpdatedFromFollowedBarn" BOOLEAN NOT NULL DEFAULT true,
    "systemNewMessage" BOOLEAN NOT NULL DEFAULT true,
    "emailNewHorseFromFollowedBarn" BOOLEAN NOT NULL DEFAULT true,
    "emailHorseUpdatedFromFollowedBarn" BOOLEAN NOT NULL DEFAULT false,
    "emailNewMessage" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarnFollow_userId_idx" ON "BarnFollow"("userId");

-- CreateIndex
CREATE INDEX "BarnFollow_sellerProfileId_idx" ON "BarnFollow"("sellerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "BarnFollow_userId_sellerProfileId_key" ON "BarnFollow"("userId", "sellerProfileId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- AddForeignKey
ALTER TABLE "BarnFollow" ADD CONSTRAINT "BarnFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarnFollow" ADD CONSTRAINT "BarnFollow_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
