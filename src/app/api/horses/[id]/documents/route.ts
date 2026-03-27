import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { getHorseWriteBlockError, getSellerWriteBlockError } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import { uploadPrivateAsset } from "@/lib/storage/private-assets";
import { trackProductEventSafely } from "@/lib/product-events/track";
import { isDocumentCategory } from "@/lib/vault/document-categories";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

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
        adminDisabledAt: true,
        adminDisableReason: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 400 });
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
        name: true,
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

    if (!horse) {
      return NextResponse.json({ error: "Horse not found." }, { status: 404 });
    }

    const horseWriteBlocked = getHorseWriteBlockError(horse);

    if (horseWriteBlocked) {
      return NextResponse.json({ error: horseWriteBlocked }, { status: 403 });
    }

    const formData = await req.formData();
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "OTHER").trim().toUpperCase();
    const file = formData.get("file");

    if (!title) {
      return NextResponse.json({ error: "Document title is required." }, { status: 400 });
    }

    if (!isDocumentCategory(category)) {
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

    const timestamp = Date.now();
    const fileName = safeFileName(file.name);
    const storedName = `${horse.id}-${timestamp}-${fileName}`;
    const storageKey = `horses/documents/${horse.id}/${storedName}`;

    await uploadPrivateAsset({
      key: storageKey,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });

    const document = await prisma.horseDocument.create({
      data: {
        horseId: horse.id,
        title,
        filePath: storageKey,
        fileName: file.name,
        mimeType: file.type || null,
        isPrivate: true,
        category,
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

    void trackProductEventSafely({
      actorUserId: session.user.id,
      eventType: "DOCUMENT_UPLOAD",
      horseId: horse.id,
      horseDocumentId: document.id,
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
