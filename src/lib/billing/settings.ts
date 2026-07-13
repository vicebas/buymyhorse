import prisma from "@/lib/db/prisma";

export const DEFAULT_BILLING_SETTINGS = {
  activationTrialEnabled: false,
  activationTrialDays: 7,
  singleHorsePriceId: process.env.STRIPE_PRICE_SINGLE_HORSE || "",
  barnStarterPriceId: process.env.STRIPE_PRICE_BARN_STARTER || "",
  barnGrowthPriceId: process.env.STRIPE_PRICE_BARN_GROWTH || "",
  barnUnlimitedPriceId: process.env.STRIPE_PRICE_BARN_UNLIMITED || "",
  extraHorsePriceId: process.env.STRIPE_PRICE_EXTRA_HORSE || "",
  equitagPhysicalPriceId: process.env.STRIPE_PRICE_EQUITAG_PHYSICAL || "",
  equitagMaxBatchQuantity: 10,
};

type BillingSettingsResult = {
  id: string;
  activationTrialEnabled: boolean;
  activationTrialDays: number;
  singleHorsePriceId: string;
  barnStarterPriceId: string;
  barnGrowthPriceId: string;
  barnUnlimitedPriceId: string;
  extraHorsePriceId: string;
  equitagPhysicalPriceId: string;
  equitagMaxBatchQuantity: number;
  stripeSecretKeyConfigured: boolean;
  stripeWebhookSecretConfigured: boolean;
  updatedAt: Date | null;
  updatedByUserId: string | null;
};

type BillingSettingsRow = {
  id?: string | null;
  activationTrialEnabled?: boolean | null;
  activationTrialDays?: number | null;
  singleHorsePriceId?: string | null;
  barnStarterPriceId?: string | null;
  barnGrowthPriceId?: string | null;
  barnUnlimitedPriceId?: string | null;
  activationMonthlyPriceId?: string | null;
  activationYearlyPriceId?: string | null;
  extraHorsePriceId?: string | null;
  equitagPhysicalPriceId?: string | null;
  equitagMaxBatchQuantity?: number | null;
  updatedAt?: Date | null;
  updatedByUserId?: string | null;
};

function mapBillingSettings(settings?: BillingSettingsRow | null): BillingSettingsResult {
  const legacyMonthlyPriceId = settings?.activationMonthlyPriceId || "";
  const legacyYearlyPriceId = settings?.activationYearlyPriceId || "";

  return {
    id: settings?.id || "default",
    activationTrialEnabled:
      settings?.activationTrialEnabled ?? DEFAULT_BILLING_SETTINGS.activationTrialEnabled,
    activationTrialDays:
      settings?.activationTrialDays ?? DEFAULT_BILLING_SETTINGS.activationTrialDays,
    singleHorsePriceId:
      settings?.singleHorsePriceId || legacyYearlyPriceId || DEFAULT_BILLING_SETTINGS.singleHorsePriceId,
    barnStarterPriceId:
      settings?.barnStarterPriceId || legacyMonthlyPriceId || DEFAULT_BILLING_SETTINGS.barnStarterPriceId,
    barnGrowthPriceId:
      settings?.barnGrowthPriceId || DEFAULT_BILLING_SETTINGS.barnGrowthPriceId,
    barnUnlimitedPriceId:
      settings?.barnUnlimitedPriceId || DEFAULT_BILLING_SETTINGS.barnUnlimitedPriceId,
    extraHorsePriceId: settings?.extraHorsePriceId || DEFAULT_BILLING_SETTINGS.extraHorsePriceId,
    equitagPhysicalPriceId:
      settings?.equitagPhysicalPriceId || DEFAULT_BILLING_SETTINGS.equitagPhysicalPriceId,
    equitagMaxBatchQuantity:
      settings?.equitagMaxBatchQuantity ?? DEFAULT_BILLING_SETTINGS.equitagMaxBatchQuantity,
    stripeSecretKeyConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    updatedAt: settings?.updatedAt ?? null,
    updatedByUserId: settings?.updatedByUserId ?? null,
  };
}

async function getLegacyCompatibleBillingSettings() {
  const columns = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'BillingSettings'
  `;
  const availableColumns = new Set(columns.map((column) => column.column_name));
  const candidateColumns = [
    "id",
    "activationTrialEnabled",
    "activationTrialDays",
    "singleHorsePriceId",
    "barnStarterPriceId",
    "barnGrowthPriceId",
    "barnUnlimitedPriceId",
    "activationMonthlyPriceId",
    "activationYearlyPriceId",
    "extraHorsePriceId",
    "equitagPhysicalPriceId",
    "equitagMaxBatchQuantity",
    "updatedAt",
    "updatedByUserId",
  ];
  const selectedColumns = candidateColumns.filter((column) => availableColumns.has(column));

  if (selectedColumns.length === 0) {
    return mapBillingSettings(null);
  }

  const selectList = selectedColumns.map((column) => `"${column}"`).join(", ");
  const rows = await prisma.$queryRawUnsafe<BillingSettingsRow[]>(
    `SELECT ${selectList} FROM "BillingSettings" WHERE "id" = $1 LIMIT 1`,
    "default"
  );

  return mapBillingSettings(rows[0] ?? null);
}

export async function getBillingSettings() {
  try {
    const settings = await prisma.billingSettings.findUnique({
      where: { id: "default" },
    });

    return mapBillingSettings(settings);
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2022") {
      return getLegacyCompatibleBillingSettings();
    }

    throw error;
  }
}
