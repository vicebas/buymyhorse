import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { logAdminAction } from "@/lib/admin/audit";
import { isAdminRole } from "@/lib/admin/roles";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    clear?: boolean;
    plan?: "SINGLE_HORSE" | "BARN_STARTER" | "BARN_GROWTH" | "BARN_UNLIMITED";
    status?: "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
    reason?: string;
    expiresAt?: string | null;
  } | null;

  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "Barn not found." }, { status: 404 });
  }

  const reason = body?.reason?.trim() || null;

  if (body?.clear) {
    await prisma.sellerProfile.update({
      where: { id },
      data: {
        adminPlanOverride: null,
        adminBillingCadenceOverride: null,
        adminBillingStatusOverride: null,
        adminBillingOverrideReason: null,
        adminBillingOverrideExpiresAt: null,
        adminBillingOverrideUpdatedAt: new Date(),
        adminBillingOverrideUpdatedByUserId: session.user.id,
      },
    });

    await logAdminAction({
      actorUserId: session.user.id,
      actionType: "BILLING_OVERRIDE_CLEARED",
      targetType: "BILLING",
      targetId: id,
      reason,
    });

    return NextResponse.json({ success: true });
  }

  if (!body?.plan || !body?.status || !reason) {
    return NextResponse.json({ error: "Plan, status, and reason are required." }, { status: 400 });
  }

  const overrideCadence = body.plan === "SINGLE_HORSE" ? "SEMIANNUAL" : "MONTHLY";

  await prisma.sellerProfile.update({
    where: { id },
    data: {
      adminPlanOverride: body.plan,
      adminBillingCadenceOverride: overrideCadence,
      adminBillingStatusOverride: body.status,
      adminBillingOverrideReason: reason,
      adminBillingOverrideExpiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      adminBillingOverrideUpdatedAt: new Date(),
      adminBillingOverrideUpdatedByUserId: session.user.id,
    },
  });

  await logAdminAction({
    actorUserId: session.user.id,
    actionType: "BILLING_OVERRIDE_SET",
    targetType: "BILLING",
    targetId: id,
    reason,
    metadata: {
      plan: body.plan,
      cadence: overrideCadence,
      status: body.status,
      expiresAt: body.expiresAt || null,
    },
  });

  return NextResponse.json({ success: true });
}
