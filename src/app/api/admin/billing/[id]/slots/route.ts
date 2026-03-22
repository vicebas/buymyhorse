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
    quantity?: number;
    note?: string;
  } | null;

  const quantity = body?.quantity;
  const note = body?.note?.trim() || "";

  if (!Number.isInteger(quantity) || quantity === 0 || !note) {
    return NextResponse.json({ error: "Quantity and note are required." }, { status: 400 });
  }

  const safeQuantity = quantity as number;

  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "Barn not found." }, { status: 404 });
  }

  await prisma.barnHorseSlotLedger.create({
    data: {
      sellerProfileId: id,
      quantity: safeQuantity,
      source: "ADMIN_ADJUSTMENT",
      adminUserId: session.user.id,
      note,
    },
  });

  await logAdminAction({
    actorUserId: session.user.id,
    actionType: "HORSE_SLOT_ADJUSTED",
    targetType: "BILLING",
    targetId: id,
    reason: note,
    metadata: {
      quantity: safeQuantity,
    },
  });

  return NextResponse.json({ success: true });
}
