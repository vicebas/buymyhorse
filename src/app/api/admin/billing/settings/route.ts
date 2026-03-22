import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { logAdminAction } from "@/lib/admin/audit";
import { isAdminRole } from "@/lib/admin/roles";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    activationTrialEnabled?: boolean;
    activationTrialDays?: number;
    activationMonthlyPriceId?: string;
    activationYearlyPriceId?: string;
    extraHorsePriceId?: string;
  } | null;

  const activationMonthlyPriceId = body?.activationMonthlyPriceId?.trim() || "";
  const activationYearlyPriceId = body?.activationYearlyPriceId?.trim() || "";
  const extraHorsePriceId = body?.extraHorsePriceId?.trim() || "";
  const activationTrialDays = body?.activationTrialDays;
  const hasValidTrialDays =
    Number.isInteger(activationTrialDays) &&
    activationTrialDays !== undefined &&
    activationTrialDays >= 0 &&
    activationTrialDays <= 90;

  if (
    typeof body?.activationTrialEnabled !== "boolean" ||
    !hasValidTrialDays ||
    !activationMonthlyPriceId ||
    !activationYearlyPriceId ||
    !extraHorsePriceId
  ) {
    return NextResponse.json({ error: "Invalid billing settings." }, { status: 400 });
  }

  const safeActivationTrialDays = activationTrialDays as number;

  await prisma.billingSettings.upsert({
    where: { id: "default" },
    update: {
      activationTrialEnabled: body.activationTrialEnabled,
      activationTrialDays: safeActivationTrialDays,
      activationMonthlyPriceId,
      activationYearlyPriceId,
      extraHorsePriceId,
      updatedByUserId: session.user.id,
    },
    create: {
      id: "default",
      activationTrialEnabled: body.activationTrialEnabled,
      activationTrialDays: safeActivationTrialDays,
      activationMonthlyPriceId,
      activationYearlyPriceId,
      extraHorsePriceId,
      updatedByUserId: session.user.id,
    },
  });

  await logAdminAction({
    actorUserId: session.user.id,
    actionType: "BILLING_SETTINGS_UPDATED",
    targetType: "BILLING",
    targetId: "default",
    reason: "Updated global activation billing settings",
    metadata: {
      activationTrialEnabled: body.activationTrialEnabled,
      activationTrialDays: safeActivationTrialDays,
      activationMonthlyPriceId,
      activationYearlyPriceId,
      extraHorsePriceId,
    },
  });

  return NextResponse.json({ success: true });
}
