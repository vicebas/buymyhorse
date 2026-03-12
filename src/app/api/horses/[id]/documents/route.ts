import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const documentCategories = [
  "XRAYS",
  "PPE",
  "VET_REPORTS",
  "CONTRACTS",
  "PASSPORT",
  "COMPETITION_RECORDS",
  "CARE",
  "OTHER",
] as const;

type DocumentCategory = (typeof documentCategories)[number];

export async function POST(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: "Seller profile not found." }, { status: 400 });
    }

    const horse = await prisma.horse.findFirst({
      where: {
        id,
        sellerProfileId: seller.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!horse) {
      return NextResponse.json({ error: "Horse not found." }, { status: 404 });
    }

    const formData = await req.formData();
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "OTHER").trim().toUpperCase();
    const file = formData.get("file");

    if (!title) {
      return NextResponse.json({ error: "Document title is required." }, { status: 400 });
    }

    if (!documentCategories.includes(category as DocumentCategory)) {
      return NextResponse.json({ error: "Invalid document category." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(
      process.cwd(),
      "private",
      "uploads",
      "horses",
      "documents"
    );

    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const fileName = safeFileName(file.name);
    const storedName = `${horse.id}-${timestamp}-${fileName}`;
    const absolutePath = path.join(uploadsDir, storedName);

    await writeFile(absolutePath, buffer);

    const document = await prisma.horseDocument.create({
      data: {
        horseId: horse.id,
        title,
        filePath: absolutePath,
        fileName: file.name,
        mimeType: file.type || null,
        isPrivate: true,
        category: category as DocumentCategory,
        fileSizeBytes: file.size,
        uploadedByUserId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        category: true,
        fileSizeBytes: true,
      },
    });

    await prisma.vaultActivityLog.create({
      data: {
        horseId: horse.id,
        horseDocumentId: document.id,
        actorUserId: session.user.id,
        activityType: "DOCUMENT_UPLOADED",
        metadata: {
          title,
          category,
          fileName: file.name,
          fileSizeBytes: file.size,
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Horse document upload failed:", error);
    return NextResponse.json(
      { error: "Unable to upload document right now." },
      { status: 500 }
    );
  }
}
