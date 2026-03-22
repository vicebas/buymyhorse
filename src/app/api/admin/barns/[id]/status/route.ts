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
    disabled?: boolean;
    reason?: string;
  } | null;

  if (typeof body?.disabled !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    select: { id: true, adminDisabledAt: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "Barn not found." }, { status: 404 });
  }

  const reason = body.reason?.trim() || null;

  await prisma.sellerProfile.update({
    where: { id },
    data: body.disabled
      ? {
          adminDisabledAt: new Date(),
          adminDisabledByUserId: session.user.id,
          adminDisableReason: reason,
        }
      : {
          adminDisabledAt: null,
          adminDisabledByUserId: null,
          adminDisableReason: null,
        },
  });

  await logAdminAction({
    actorUserId: session.user.id,
    actionType: body.disabled ? "BARN_DISABLED" : "BARN_RESTORED",
    targetType: "BARN",
    targetId: id,
    reason,
    metadata: {
      previousDisabledAt: seller.adminDisabledAt?.toISOString() || null,
    },
  });

  return NextResponse.json({ success: true });
}
