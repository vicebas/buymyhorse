import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { getSellerWriteBlockError } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import { removeHorseMediaFiles } from "@/lib/media/horse-media";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const { id, mediaId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Barn not found" }, { status: 400 });
  }

  const sellerWriteBlocked = getSellerWriteBlockError(seller);

  if (sellerWriteBlocked) {
    return NextResponse.json({ error: sellerWriteBlocked }, { status: 403 });
  }

  const media = await prisma.horseMedia.findFirst({
    where: {
      id: mediaId,
      horseId: id,
      horse: {
        sellerProfileId: seller.id,
      },
    },
    include: {
      horse: {
        select: {
          adminDisabledAt: true,
          adminDisableReason: true,
          sellerProfile: {
            select: {
              adminDisabledAt: true,
              adminDisableReason: true,
            },
          },
        },
      },
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  if (media.horse.sellerProfile.adminDisabledAt) {
    return NextResponse.json(
      { error: media.horse.sellerProfile.adminDisableReason || "This barn is currently disabled by admin." },
      { status: 403 }
    );
  }

  if (media.horse.adminDisabledAt) {
    return NextResponse.json(
      { error: media.horse.adminDisableReason || "This horse is currently disabled by admin." },
      { status: 403 }
    );
  }

  await prisma.horseMedia.delete({
    where: {
      id: media.id,
    },
  });

  await removeHorseMediaFiles({
    originalPath: media.originalPath,
    processedPath: media.processedPath,
    posterPath: media.posterPath,
  });

  return NextResponse.json({ success: true });
}
