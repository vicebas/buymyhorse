import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

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
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 400 });
  }

  const existingHorse = await prisma.horse.findFirst({
    where: {
      id,
      sellerProfileId: seller.id,
    },
  });

  if (!existingHorse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const formData = await req.formData();

  const name = String(formData.get("name") || "").trim();
  const breed = String(formData.get("breed") || "").trim();
  const age = String(formData.get("age") || "").trim();
  const price = String(formData.get("price") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const discipline = String(formData.get("discipline") || "").trim();
  const level = String(formData.get("level") || "").trim();
  const height = String(formData.get("height") || "").trim();
  const gender = String(formData.get("gender") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const saleStatus = String(formData.get("saleStatus") || "FOR_SALE").trim();
  const publishToMarketplace = formData.get("isPublished") === "on";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const file = formData.get("image") as File | null;
  let imagePath = existingHorse.image;

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public/uploads/horses");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${safeFileName(file.name)}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);
    imagePath = `/uploads/horses/${filename}`;
  }
  console.log(existingHorse)
  const horse = await prisma.horse.update({
    where: {
      id: existingHorse.id,
    },
    data: {
      name,
      breed: breed || null,
      age: age ? Number(age) : null,
      price: price ? price : null,
      description: description || null,
      discipline: discipline || null,
      level: level || null,
      height: height || null,
      gender: gender || null,
      location: location || null,
      saleStatus: saleStatus as
        | "FOR_SALE"
        | "CONSIDERING_OFFERS"
        | "LEASE"
        | "SOLD"
        | "NOT_AVAILABLE",
      image: imagePath,
      isPublished: publishToMarketplace,
    },
  });

  return NextResponse.json(horse);
} 