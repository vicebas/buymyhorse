import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  const { id: horseId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = session.user.id;

  const existing = await prisma.savedHorse.findUnique({
    where: { userId_horseId: { userId, horseId } },
  });

  if (existing) {
    await prisma.savedHorse.delete({
      where: { userId_horseId: { userId, horseId } },
    });
    return NextResponse.json({ saved: false });
  }

  // Verify horse exists and is publicly visible before saving
  const horse = await prisma.horse.findUnique({
    where: { id: horseId },
    select: { id: true, isPublished: true, deletedAt: true, adminDisabledAt: true },
  });

  if (!horse || horse.deletedAt || horse.adminDisabledAt || !horse.isPublished) {
    return NextResponse.json({ error: "Horse not found." }, { status: 404 });
  }

  await prisma.savedHorse.create({
    data: { userId, horseId },
  });

  return NextResponse.json({ saved: true });
}
