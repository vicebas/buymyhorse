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
    cadence?: "MONTHLY" | "YEARLY";
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

  if (!body?.cadence || !body?.status || !reason) {
    return NextResponse.json({ error: "Cadence, status, and reason are required." }, { status: 400 });
  }

  await prisma.sellerProfile.update({
    where: { id },
    data: {
      adminPlanOverride: "ACTIVATION",
      adminBillingCadenceOverride: body.cadence,
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
      plan: "ACTIVATION",
      cadence: body.cadence,
      status: body.status,
      expiresAt: body.expiresAt || null,
    },
  });

  return NextResponse.json({ success: true });
}
