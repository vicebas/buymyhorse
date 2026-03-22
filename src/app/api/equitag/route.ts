import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { getSellerWriteBlockError } from "@/lib/admin/moderation";
import prisma from "@/lib/db/prisma";
import { createEquiTag } from "@/lib/equitag/service";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

  const equiTag = await createEquiTag(seller.id);

  return NextResponse.json(equiTag, { status: 201 });
}
