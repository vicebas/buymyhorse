import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { getHorseWriteBlockError, getSellerWriteBlockError } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import {
  HORSE_GALLERY_MAX_IMAGES,
  HORSE_GALLERY_MAX_VIDEOS,
  HORSE_IMAGE_MAX_BYTES,
  HORSE_VIDEO_MAX_BYTES,
} from "@/lib/horses/media-limits";
import { processHorseMediaUpload } from "@/lib/media/horse-media";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const horse = await prisma.horse.findFirst({
    where: {
      id,
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
      _count: {
        select: {
          media: true,
        },
      },
      media: {
        select: {
          type: true,
        },
      },
    },
  });

  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const horseWriteBlocked = getHorseWriteBlockError(horse);

  if (horseWriteBlocked) {
    return NextResponse.json({ error: horseWriteBlocked }, { status: 403 });
  }

  const formData = await req.formData();
  const files = formData
    .getAll("media")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Choose at least one media file." }, { status: 400 });
  }

  const nextImageFiles = files.filter((file) => file.type.startsWith("image/"));
  const nextVideoFiles = files.filter((file) => file.type.startsWith("video/"));
  const existingImageCount = horse.media.filter((item) => item.type === "IMAGE").length;
  const existingVideoCount = horse.media.filter((item) => item.type === "VIDEO").length;

  if (files.some((file) => file.type.startsWith("image/") && file.size > HORSE_IMAGE_MAX_BYTES)) {
    return NextResponse.json({ error: "Gallery photos must be 10 MB or smaller." }, { status: 400 });
  }

  if (files.some((file) => file.type.startsWith("video/") && file.size > HORSE_VIDEO_MAX_BYTES)) {
    return NextResponse.json({ error: "Hosted horse videos must be 250 MB or smaller." }, { status: 400 });
  }

  if (existingImageCount + nextImageFiles.length > HORSE_GALLERY_MAX_IMAGES) {
    return NextResponse.json(
      { error: `Each horse can have up to ${HORSE_GALLERY_MAX_IMAGES} gallery photos.` },
      { status: 400 }
    );
  }

  if (existingVideoCount + nextVideoFiles.length > HORSE_GALLERY_MAX_VIDEOS) {
    return NextResponse.json(
      { error: `Each horse can have up to ${HORSE_GALLERY_MAX_VIDEOS} hosted videos.` },
      { status: 400 }
    );
  }

  try {
    const startingOrder = horse._count.media;
    const processed = await Promise.all(
      files.map((file, index) =>
        processHorseMediaUpload({
          horseId: horse.id,
          file,
        }).then((item) => ({
          ...item,
          sortOrder: startingOrder + index,
        }))
      )
    );

    const created = await prisma.$transaction(
      processed.map((item) =>
        prisma.horseMedia.create({
          data: {
            horseId: horse.id,
            type: item.type,
            status: "READY",
            originalPath: item.originalPath,
            processedPath: item.processedPath,
            posterPath: item.posterPath,
            mimeType: item.mimeType,
            fileName: item.fileName,
            sortOrder: item.sortOrder,
          },
        })
      )
    );

    return NextResponse.json({ media: created });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not process upload.",
      },
      { status: 500 }
    );
  }
}
