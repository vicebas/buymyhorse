import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { logAdminAction } from "@/lib/admin/audit";
import { isAdminRole } from "@/lib/admin/roles";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";

function normalizeEquiTagFulfillmentEmails(input: unknown) {
  if (typeof input !== "string") {
    return [];
  }

  return Array.from(
    new Set(
      input
        .split(/\r?\n/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    activationTrialEnabled?: boolean;
    activationTrialDays?: number;
    singleHorsePriceId?: string;
    barnStarterPriceId?: string;
    barnGrowthPriceId?: string;
    barnUnlimitedPriceId?: string;
    extraHorsePriceId?: string;
    equitagPhysicalPriceId?: string;
    equitagMaxBatchQuantity?: number;
    equitagFulfillmentEmails?: string;
  } | null;

  const singleHorsePriceId = body?.singleHorsePriceId?.trim() || "";
  const barnStarterPriceId = body?.barnStarterPriceId?.trim() || "";
  const barnGrowthPriceId = body?.barnGrowthPriceId?.trim() || "";
  const barnUnlimitedPriceId = body?.barnUnlimitedPriceId?.trim() || "";
  const extraHorsePriceId = body?.extraHorsePriceId?.trim() || "";
  const equitagPhysicalPriceId = body?.equitagPhysicalPriceId?.trim() || "";
  const equitagMaxBatchQuantity = body?.equitagMaxBatchQuantity;
  const equitagFulfillmentEmails = normalizeEquiTagFulfillmentEmails(body?.equitagFulfillmentEmails);
  const hasValidBatchQty =
    equitagMaxBatchQuantity === undefined ||
    (Number.isInteger(equitagMaxBatchQuantity) && equitagMaxBatchQuantity >= 1 && equitagMaxBatchQuantity <= 100);
  const activationTrialDays = body?.activationTrialDays;
  const hasValidTrialDays =
    Number.isInteger(activationTrialDays) &&
    activationTrialDays !== undefined &&
    activationTrialDays >= 0 &&
    activationTrialDays <= 90;

  if (
    typeof body?.activationTrialEnabled !== "boolean" ||
    !hasValidTrialDays ||
    !hasValidBatchQty ||
    !singleHorsePriceId ||
    !barnStarterPriceId ||
    !barnGrowthPriceId ||
    !barnUnlimitedPriceId ||
    !extraHorsePriceId
  ) {
    return NextResponse.json({ error: "Invalid billing settings." }, { status: 400 });
  }

  const safeActivationTrialDays = activationTrialDays as number;
  const safeBatchQty = equitagMaxBatchQuantity ?? 10;

  await prisma.billingSettings.upsert({
    where: { id: "default" },
    update: {
      activationTrialEnabled: body.activationTrialEnabled,
      activationTrialDays: safeActivationTrialDays,
      singleHorsePriceId,
      barnStarterPriceId,
      barnGrowthPriceId,
      barnUnlimitedPriceId,
      extraHorsePriceId,
      equitagPhysicalPriceId,
      equitagMaxBatchQuantity: safeBatchQty,
      equitagFulfillmentEmails,
      updatedByUserId: session.user.id,
    },
    create: {
      id: "default",
      activationTrialEnabled: body.activationTrialEnabled,
      activationTrialDays: safeActivationTrialDays,
      singleHorsePriceId,
      barnStarterPriceId,
      barnGrowthPriceId,
      barnUnlimitedPriceId,
      extraHorsePriceId,
      equitagPhysicalPriceId,
      equitagMaxBatchQuantity: safeBatchQty,
      equitagFulfillmentEmails,
      updatedByUserId: session.user.id,
    },
  });

  await logAdminAction({
    actorUserId: session.user.id,
    actionType: "BILLING_SETTINGS_UPDATED",
    targetType: "BILLING",
    targetId: "default",
    reason: "Updated global launch billing settings",
    metadata: {
      activationTrialEnabled: body.activationTrialEnabled,
      activationTrialDays: safeActivationTrialDays,
      singleHorsePriceId,
      barnStarterPriceId,
      barnGrowthPriceId,
      barnUnlimitedPriceId,
      extraHorsePriceId,
      equitagPhysicalPriceId,
      equitagMaxBatchQuantity: safeBatchQty,
      equitagFulfillmentEmails,
    },
  });

  return NextResponse.json({ success: true });
}
