/*
  Warnings:

  - You are about to drop the column `galleryImages` on the `Horse` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrls` on the `Horse` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "HorseMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Horse" DROP COLUMN "galleryImages",
DROP COLUMN "videoUrls";

-- CreateTable
CREATE TABLE "HorseMedia" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "type" "HorseMediaType" NOT NULL,
    "originalPath" TEXT NOT NULL,
    "processedPath" TEXT NOT NULL,
    "posterPath" TEXT,
    "mimeType" TEXT,
    "fileName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HorseMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HorseMedia_horseId_sortOrder_idx" ON "HorseMedia"("horseId", "sortOrder");

-- AddForeignKey
ALTER TABLE "HorseMedia" ADD CONSTRAINT "HorseMedia_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
