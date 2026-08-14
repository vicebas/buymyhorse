ALTER TABLE "Horse"
ADD COLUMN IF NOT EXISTS "sire" TEXT,
ADD COLUMN IF NOT EXISTS "dam" TEXT,
ADD COLUMN IF NOT EXISTS "damSire" TEXT;

UPDATE "Horse" h
SET "sire" = so."label"
FROM "SireOption" so
WHERE h."sire" IS NULL
  AND h."sireOptionId" = so."id";

UPDATE "Horse" h
SET "dam" = d."label"
FROM "DamOption" d
WHERE h."dam" IS NULL
  AND h."damOptionId" = d."id";

UPDATE "Horse" h
SET "damSire" = ds."label"
FROM "DamSireOption" ds
WHERE h."damSire" IS NULL
  AND h."damSireOptionId" = ds."id";
