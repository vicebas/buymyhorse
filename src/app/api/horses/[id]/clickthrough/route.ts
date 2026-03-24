import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const horse = await prisma.horse.findUnique({
    where: { id },
    select: {
      id: true,
      isPublished: true,
      deletedAt: true,
      adminDisabledAt: true,
    },
  });

  if (!horse || !horse.isPublished || horse.deletedAt || horse.adminDisabledAt) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  await prisma.horseFeatureMetrics.upsert({
    where: { horseId: id },
    update: {
      clickThroughs: {
        increment: 1,
      },
      lastClickThroughAt: new Date(),
    },
    create: {
      horseId: id,
      clickThroughs: 1,
      lastClickThroughAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
