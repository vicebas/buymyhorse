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
  const body = (await req.json().catch(() => null)) as { reason?: string } | null;
  const reason = body?.reason?.trim() || null;

  const grant = await prisma.accessGrant.findUnique({
    where: { id },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
          sellerProfile: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!grant) {
    return NextResponse.json({ error: "Grant not found." }, { status: 404 });
  }

  if (grant.revokedAt) {
    return NextResponse.json({ error: "Grant is already revoked." }, { status: 400 });
  }

  const revokedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.accessGrant.update({
      where: { id: grant.id },
      data: {
        revokedAt,
        note: reason,
      },
    });

    await tx.accessRequest.updateMany({
      where: {
        horseId: grant.horseId,
        buyerId: grant.buyerId,
        status: "APPROVED",
      },
      data: {
        status: "REVOKED",
        decisionNote: reason,
      },
    });

    await tx.vaultActivityLog.create({
      data: {
        horseId: grant.horseId,
        accessGrantId: grant.id,
        actorUserId: session.user.id,
        activityType: "ACCESS_GRANT_REVOKED",
        metadata: {
          reason,
          revokedAt: revokedAt.toISOString(),
          source: "admin",
        },
      },
    });
  });

  await logAdminAction({
    actorUserId: session.user.id,
    actionType: "ADMIN_GRANT_REVOKED",
    targetType: "ACCESS_GRANT",
    targetId: grant.id,
    reason,
    metadata: {
      horseId: grant.horseId,
      horseName: grant.horse.name,
      barnId: grant.horse.sellerProfile.id,
      barnDisplayName: grant.horse.sellerProfile.displayName,
      buyerId: grant.buyer.id,
      buyerLabel: grant.buyer.name || grant.buyer.email || grant.buyer.id,
      revokedAt: revokedAt.toISOString(),
    },
  });

  return NextResponse.json({ success: true });
}
