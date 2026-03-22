ALTER TABLE "AccessRequest"
ADD COLUMN "intendedUse" TEXT;

CREATE TABLE "AccessRequestCategory" (
    "id" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessRequestCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessRequestCategory_accessRequestId_category_key"
ON "AccessRequestCategory"("accessRequestId", "category");

CREATE INDEX "AccessRequestCategory_category_idx"
ON "AccessRequestCategory"("category");

ALTER TABLE "AccessRequestCategory"
ADD CONSTRAINT "AccessRequestCategory_accessRequestId_fkey"
FOREIGN KEY ("accessRequestId") REFERENCES "AccessRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
