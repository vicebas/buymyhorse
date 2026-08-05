import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";

type ExpirationBody = {
  expiresAt?: string | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const body = (await req.json().catch(() => null)) as ExpirationBody | null;
  const expiresAtValue = body?.expiresAt?.trim() || null;
  const expiresAt = expiresAtValue ? new Date(`${expiresAtValue}T23:59:59.999Z`) : null;

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Enter a valid expiration date." }, { status: 400 });
  }

  const { id } = await params;
  const grant = await prisma.accessGrant.findUnique({
    where: { id },
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

  const updated = await prisma.$transaction(async (tx) => {
    const nextGrant = await tx.accessGrant.update({
      where: { id: grant.id },
      data: {
        expiresAt,
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    await tx.vaultActivityLog.create({
      data: {
        horseId: grant.horseId,
        accessGrantId: grant.id,
        actorUserId: session.user.id,
        activityType: "ACCESS_REQUEST_APPROVED",
        metadata: {
          source: "EXPIRATION_UPDATE",
          expiresAt: expiresAt?.toISOString() ?? null,
        },
      },
    });

    return nextGrant;
  });

  return NextResponse.json(updated);
}
