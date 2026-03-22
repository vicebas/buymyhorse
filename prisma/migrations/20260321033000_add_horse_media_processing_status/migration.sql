-- CreateEnum
CREATE TYPE "HorseMediaProcessingStatus" AS ENUM ('PENDING_UPLOAD', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "HorseMedia"
ADD COLUMN "status" "HorseMediaProcessingStatus" NOT NULL DEFAULT 'READY',
ALTER COLUMN "processedPath" DROP NOT NULL;
