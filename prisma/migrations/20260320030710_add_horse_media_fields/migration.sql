/*
  Warnings:

  - You are about to drop the column `intendedUse` on the `AccessRequest` table. All the data in the column will be lost.
  - You are about to drop the `AccessGrantCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccessRequestCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccessRequestFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "HorseMessageType" AS ENUM ('TEXT', 'GRANT');

-- DropForeignKey
ALTER TABLE "AccessGrantCategory" DROP CONSTRAINT "AccessGrantCategory_accessGrantId_fkey";

-- DropForeignKey
ALTER TABLE "AccessRequestCategory" DROP CONSTRAINT "AccessRequestCategory_accessRequestId_fkey";

-- DropForeignKey
ALTER TABLE "AccessRequestFile" DROP CONSTRAINT "AccessRequestFile_accessRequestId_fkey";

-- DropForeignKey
ALTER TABLE "AccessRequestFile" DROP CONSTRAINT "AccessRequestFile_horseDocumentId_fkey";

-- AlterTable
ALTER TABLE "AccessRequest" DROP COLUMN "intendedUse";

-- AlterTable
ALTER TABLE "Horse" ADD COLUMN     "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "HorseMessage" ADD COLUMN     "accessGrantId" TEXT,
ADD COLUMN     "messageType" "HorseMessageType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "body" DROP NOT NULL;

-- DropTable
DROP TABLE "AccessGrantCategory";

-- DropTable
DROP TABLE "AccessRequestCategory";

-- DropTable
DROP TABLE "AccessRequestFile";

-- AddForeignKey
ALTER TABLE "HorseMessage" ADD CONSTRAINT "HorseMessage_accessGrantId_fkey" FOREIGN KEY ("accessGrantId") REFERENCES "AccessGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
