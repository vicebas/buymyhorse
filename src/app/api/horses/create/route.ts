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
  });

  if (!seller) {
    return NextResponse.json(
      { error: "Seller profile not found" },
      { status: 400 }
    );
  }

  const body = await req.json();

  const horse = await prisma.horse.create({
    data: {
      sellerProfileId: seller.id,
      name: body.name,
      breed: body.breed || null,
      age: body.age ? Number(body.age) : null,
      price: body.price ? Number(body.price) : null,
      description: body.description || null,
      isPublished: true,
    },
  });

  return NextResponse.json(horse);
}