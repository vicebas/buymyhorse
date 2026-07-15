ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EQUITAG_FULFILLMENT_NEEDED';

ALTER TABLE "BillingSettings"
ADD COLUMN "equitagFulfillmentEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "BillingSettings"
SET "equitagFulfillmentEmails" = ARRAY[]::TEXT[]
WHERE "equitagFulfillmentEmails" IS NULL;

ALTER TABLE "BillingSettings"
ALTER COLUMN "equitagFulfillmentEmails" SET NOT NULL;
