-- CreateTable
CREATE TABLE "HorseFeatureMetrics" (
    "horseId" TEXT NOT NULL,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "clickThroughs" INTEGER NOT NULL DEFAULT 0,
    "lastProfileViewAt" TIMESTAMP(3),
    "lastClickThroughAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HorseFeatureMetrics_pkey" PRIMARY KEY ("horseId")
);

-- AddForeignKey
ALTER TABLE "HorseFeatureMetrics" ADD CONSTRAINT "HorseFeatureMetrics_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
