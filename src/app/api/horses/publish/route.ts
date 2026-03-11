import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json(
      { error: "Seller profile not found" },
      { status: 400 }
    );
  }

  const body = await req.json();

  const existingHorse = await prisma.horse.findUnique({
    where: {
      id: body.id,
    },
    select: {
      id: true,
      sellerProfileId: true,
    },
  });

  if (!existingHorse || existingHorse.sellerProfileId !== seller.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const horse = await prisma.horse.update({
    where: {
      id: body.id,
    },
    data: {
      isPublished: Boolean(body.isPublished),
    },
  });

  return NextResponse.json(horse);
}