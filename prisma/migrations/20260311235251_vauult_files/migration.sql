/*
  Warnings:

  - The values [CANCELLED] on the enum `AccessRequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[publicHorseId]` on the table `Horse` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `AccessGrant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `HorseDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedByUserId` to the `HorseDocument` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('XRAYS', 'PPE', 'VET_REPORTS', 'CONTRACTS', 'PASSPORT', 'COMPETITION_RECORDS', 'CARE', 'OTHER');

-- CreateEnum
CREATE TYPE "VaultActivityType" AS ENUM ('DOCUMENT_UPLOADED', 'DOCUMENT_RENAMED', 'DOCUMENT_MOVED', 'DOCUMENT_SOFT_DELETED', 'ACCESS_REQUEST_CREATED', 'ACCESS_REQUEST_APPROVED', 'ACCESS_REQUEST_DENIED', 'ACCESS_GRANT_REVOKED');

-- AlterEnum
BEGIN;
CREATE TYPE "AccessRequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'REVOKED');
ALTER TABLE "public"."AccessRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AccessRequest" ALTER COLUMN "status" TYPE "AccessRequestStatus_new" USING ("status"::text::"AccessRequestStatus_new");
ALTER TYPE "AccessRequestStatus" RENAME TO "AccessRequestStatus_old";
ALTER TYPE "AccessRequestStatus_new" RENAME TO "AccessRequestStatus";
DROP TYPE "public"."AccessRequestStatus_old";
ALTER TABLE "AccessRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "AccessRequest_horseId_buyerId_key";

-- AlterTable
ALTER TABLE "AccessGrant" ADD COLUMN     "note" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AccessRequest" ADD COLUMN     "decisionNote" TEXT,
ADD COLUMN     "intendedUse" TEXT;

-- AlterTable
ALTER TABLE "Horse" ADD COLUMN     "aiHighlights" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "keyDetails" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "publicHorseId" TEXT;

-- AlterTable
ALTER TABLE "HorseDocument" ADD COLUMN     "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "fileSizeBytes" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadedByUserId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AccessRequestCategory" (
    "id" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessRequestCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequestFile" (
    "id" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    "horseDocumentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessRequestFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessGrantCategory" (
    "id" TEXT NOT NULL,
    "accessGrantId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessGrantCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessGrantFile" (
    "id" TEXT NOT NULL,
    "accessGrantId" TEXT NOT NULL,
    "horseDocumentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessGrantFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultActivityLog" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "horseDocumentId" TEXT,
    "accessRequestId" TEXT,
    "accessGrantId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "activityType" "VaultActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VaultActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessRequestCategory_category_idx" ON "AccessRequestCategory"("category");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequestCategory_accessRequestId_category_key" ON "AccessRequestCategory"("accessRequestId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequestFile_accessRequestId_horseDocumentId_key" ON "AccessRequestFile"("accessRequestId", "horseDocumentId");

-- CreateIndex
CREATE INDEX "AccessGrantCategory_category_idx" ON "AccessGrantCategory"("category");

-- CreateIndex
CREATE UNIQUE INDEX "AccessGrantCategory_accessGrantId_category_key" ON "AccessGrantCategory"("accessGrantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "AccessGrantFile_accessGrantId_horseDocumentId_key" ON "AccessGrantFile"("accessGrantId", "horseDocumentId");

-- CreateIndex
CREATE INDEX "VaultActivityLog_horseId_createdAt_idx" ON "VaultActivityLog"("horseId", "createdAt");

-- CreateIndex
CREATE INDEX "VaultActivityLog_activityType_createdAt_idx" ON "VaultActivityLog"("activityType", "createdAt");

-- CreateIndex
CREATE INDEX "AccessGrant_expiresAt_idx" ON "AccessGrant"("expiresAt");

-- CreateIndex
CREATE INDEX "AccessGrant_revokedAt_idx" ON "AccessGrant"("revokedAt");

-- CreateIndex
CREATE INDEX "AccessRequest_horseId_buyerId_idx" ON "AccessRequest"("horseId", "buyerId");

-- CreateIndex
CREATE INDEX "AccessRequest_status_idx" ON "AccessRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Horse_publicHorseId_key" ON "Horse"("publicHorseId");

-- CreateIndex
CREATE INDEX "HorseDocument_horseId_deletedAt_idx" ON "HorseDocument"("horseId", "deletedAt");

-- CreateIndex
CREATE INDEX "HorseDocument_category_idx" ON "HorseDocument"("category");

-- AddForeignKey
ALTER TABLE "HorseDocument" ADD CONSTRAINT "HorseDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequestCategory" ADD CONSTRAINT "AccessRequestCategory_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequestFile" ADD CONSTRAINT "AccessRequestFile_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequestFile" ADD CONSTRAINT "AccessRequestFile_horseDocumentId_fkey" FOREIGN KEY ("horseDocumentId") REFERENCES "HorseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGrantCategory" ADD CONSTRAINT "AccessGrantCategory_accessGrantId_fkey" FOREIGN KEY ("accessGrantId") REFERENCES "AccessGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGrantFile" ADD CONSTRAINT "AccessGrantFile_accessGrantId_fkey" FOREIGN KEY ("accessGrantId") REFERENCES "AccessGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGrantFile" ADD CONSTRAINT "AccessGrantFile_horseDocumentId_fkey" FOREIGN KEY ("horseDocumentId") REFERENCES "HorseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultActivityLog" ADD CONSTRAINT "VaultActivityLog_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultActivityLog" ADD CONSTRAINT "VaultActivityLog_horseDocumentId_fkey" FOREIGN KEY ("horseDocumentId") REFERENCES "HorseDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultActivityLog" ADD CONSTRAINT "VaultActivityLog_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultActivityLog" ADD CONSTRAINT "VaultActivityLog_accessGrantId_fkey" FOREIGN KEY ("accessGrantId") REFERENCES "AccessGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultActivityLog" ADD CONSTRAINT "VaultActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
