import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { getSellerWriteBlockError } from "@/lib/admin/moderation";
import prisma from "@/lib/db/prisma";
import {
  attachEquiTagToBarn,
  attachEquiTagToHorse,
  detachEquiTag,
} from "@/lib/equitag/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      adminDisabledAt: true,
      adminDisableReason: true,
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Barn profile not found." }, { status: 404 });
  }

  const sellerWriteBlocked = getSellerWriteBlockError(seller);

  if (sellerWriteBlocked) {
    return NextResponse.json({ error: sellerWriteBlocked }, { status: 403 });
  }

  const equiTag = await prisma.equiTag.findFirst({
    where: {
      id,
      ownerSellerProfileId: seller.id,
    },
    select: { id: true },
  });

  if (!equiTag) {
    return NextResponse.json({ error: "EquiTag not found." }, { status: 404 });
  }

  const body = (await req.json()) as {
    targetType?: "BARN" | "HORSE" | null;
    barnId?: string | null;
    horseId?: string | null;
  };

  if (!body.targetType) {
    const detached = await detachEquiTag(equiTag.id);
    return NextResponse.json(detached);
  }

  if (body.targetType === "BARN") {
    if (body.barnId && body.barnId !== seller.id) {
      return NextResponse.json({ error: "Invalid barn target." }, { status: 400 });
    }

    const attached = await attachEquiTagToBarn(equiTag.id, seller.id);
    return NextResponse.json(attached);
  }

  if (!body.horseId) {
    return NextResponse.json({ error: "Horse target is required." }, { status: 400 });
  }

  const targetHorse = await prisma.horse.findFirst({
    where: {
      id: body.horseId,
      sellerProfileId: seller.id,
    },
    select: {
      id: true,
      adminDisabledAt: true,
      adminDisableReason: true,
      sellerProfile: {
        select: {
          adminDisabledAt: true,
          adminDisableReason: true,
        },
      },
    },
  });

  if (!targetHorse) {
    return NextResponse.json({ error: "Horse target not found." }, { status: 404 });
  }

  if (targetHorse.sellerProfile.adminDisabledAt) {
    return NextResponse.json(
      {
        error:
          targetHorse.sellerProfile.adminDisableReason ||
          "This barn is currently disabled by admin.",
      },
      { status: 403 }
    );
  }

  if (targetHorse.adminDisabledAt) {
    return NextResponse.json(
      {
        error:
          targetHorse.adminDisableReason ||
          "This horse is currently disabled by admin.",
      },
      { status: 403 }
    );
  }

  try {
    const attached = await attachEquiTagToHorse(equiTag.id, seller.id, body.horseId);
    return NextResponse.json(attached);
  } catch {
    return NextResponse.json({ error: "Horse target not found." }, { status: 404 });
  }
}
