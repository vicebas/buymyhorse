import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

type RevokeBody = {
  note?: string;
};

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    const body = (await req.json()) as RevokeBody;
    const note = body.note?.trim() || null;

    const grant = await prisma.accessGrant.findUnique({
      where: {
        id,
      },
      include: {
        horse: {
          select: {
            id: true,
            sellerProfileId: true,
          },
        },
      },
    });

    if (!grant) {
      return NextResponse.json({ error: "Grant not found." }, { status: 404 });
    }

    if (grant.horse.sellerProfileId !== seller.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    if (grant.revokedAt) {
      return NextResponse.json({ error: "Grant is already revoked." }, { status: 400 });
    }

    const revokedAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const revokedGrant = await tx.accessGrant.update({
        where: {
          id: grant.id,
        },
        data: {
          revokedAt,
          note,
        },
        select: {
          id: true,
          horseId: true,
          buyerId: true,
          expiresAt: true,
          revokedAt: true,
          note: true,
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
          decisionNote: note,
        },
      });

      await tx.vaultActivityLog.create({
        data: {
          horseId: grant.horseId,
          accessGrantId: grant.id,
          actorUserId: session.user.id,
          activityType: "ACCESS_GRANT_REVOKED",
          metadata: {
            note,
            revokedAt: revokedAt.toISOString(),
          },
        },
      });

      return revokedGrant;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Grant revoke failed:", error);
    return NextResponse.json(
      { error: "Unable to revoke grant right now." },
      { status: 500 }
    );
  }
}
