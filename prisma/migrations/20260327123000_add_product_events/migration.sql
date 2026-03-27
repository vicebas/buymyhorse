CREATE TYPE "ProductEventType" AS ENUM (
  'SIGNUP',
  'LOGIN',
  'HORSE_CREATION',
  'HORSE_EDIT',
  'DOCUMENT_UPLOAD',
  'GALLERY_UPLOAD'
);

CREATE TABLE "ProductEvent" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "eventType" "ProductEventType" NOT NULL,
  "horseId" TEXT,
  "horseDocumentId" TEXT,
  "horseMediaId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductEvent_eventType_createdAt_idx" ON "ProductEvent"("eventType", "createdAt");
CREATE INDEX "ProductEvent_actorUserId_createdAt_idx" ON "ProductEvent"("actorUserId", "createdAt");
CREATE INDEX "ProductEvent_horseId_createdAt_idx" ON "ProductEvent"("horseId", "createdAt");
CREATE INDEX "ProductEvent_horseDocumentId_createdAt_idx" ON "ProductEvent"("horseDocumentId", "createdAt");
CREATE INDEX "ProductEvent_horseMediaId_createdAt_idx" ON "ProductEvent"("horseMediaId", "createdAt");

ALTER TABLE "ProductEvent"
ADD CONSTRAINT "ProductEvent_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
