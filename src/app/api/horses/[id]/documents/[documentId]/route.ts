import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { getHorseWriteBlockError, getSellerWriteBlockError } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import { isDocumentCategory } from "@/lib/vault/document-categories";

interface RouteContext {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
}

type PatchBody = {
  title?: string;
  category?: string;
};

async function loadSellerHorseDocument(userId: string, horseId: string, documentId: string) {
  const seller = await prisma.sellerProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      adminDisabledAt: true,
      adminDisableReason: true,
    },
  });

  if (!seller) {
    return { error: "Seller profile not found.", status: 404 } as const;
  }

  const sellerWriteBlocked = getSellerWriteBlockError(seller);

  if (sellerWriteBlocked) {
    return { error: sellerWriteBlocked, status: 403 } as const;
  }

  const horse = await prisma.horse.findFirst({
    where: {
      id: horseId,
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
      documents: {
        where: {
          id: documentId,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          category: true,
          fileName: true,
        },
      },
    },
  });

  if (!horse) {
    return { error: "Horse not found.", status: 404 } as const;
  }

  const horseWriteBlocked = getHorseWriteBlockError(horse);

  if (horseWriteBlocked) {
    return { error: horseWriteBlocked, status: 403 } as const;
  }

  const document = horse.documents[0];

  if (!document) {
    return { error: "Document not found.", status: 404 } as const;
  }

  return { seller, horse, document } as const;
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, documentId } = await params;
    const result = await loadSellerHorseDocument(session.user.id, id, documentId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = (await req.json()) as PatchBody;
    const nextTitle = body.title?.trim() ?? result.document.title;
    const nextCategory = body.category?.trim().toUpperCase() ?? result.document.category;

    if (!nextTitle) {
      return NextResponse.json({ error: "Document title is required." }, { status: 400 });
    }

    if (!isDocumentCategory(nextCategory)) {
      return NextResponse.json({ error: "Invalid document category." }, { status: 400 });
    }

    const titleChanged = nextTitle !== result.document.title;
    const categoryChanged = nextCategory !== result.document.category;

    if (!titleChanged && !categoryChanged) {
      return NextResponse.json({
        id: result.document.id,
        title: result.document.title,
        category: result.document.category,
      });
    }

    const document = await prisma.$transaction(async (tx) => {
      const updatedDocument = await tx.horseDocument.update({
        where: {
          id: result.document.id,
        },
        data: {
          title: nextTitle,
          category: nextCategory,
        },
        select: {
          id: true,
          title: true,
          category: true,
        },
      });

      if (titleChanged) {
        await tx.vaultActivityLog.create({
          data: {
            horseId: result.horse.id,
            horseDocumentId: result.document.id,
            actorUserId: session.user.id,
            activityType: "DOCUMENT_RENAMED",
            metadata: {
              previousTitle: result.document.title,
              nextTitle,
            },
          },
        });
      }

      if (categoryChanged) {
        await tx.vaultActivityLog.create({
          data: {
            horseId: result.horse.id,
            horseDocumentId: result.document.id,
            actorUserId: session.user.id,
            activityType: "DOCUMENT_MOVED",
            metadata: {
              previousCategory: result.document.category,
              nextCategory,
            },
          },
        });
      }

      return updatedDocument;
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Horse document update failed:", error);
    return NextResponse.json(
      { error: "Unable to update the document right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, documentId } = await params;
    const result = await loadSellerHorseDocument(session.user.id, id, documentId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await prisma.$transaction(async (tx) => {
      await tx.horseDocument.update({
        where: {
          id: result.document.id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      await tx.vaultActivityLog.create({
        data: {
          horseId: result.horse.id,
          horseDocumentId: result.document.id,
          actorUserId: session.user.id,
          activityType: "DOCUMENT_SOFT_DELETED",
          metadata: {
            title: result.document.title,
            category: result.document.category,
            fileName: result.document.fileName,
          },
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Horse document delete failed:", error);
    return NextResponse.json(
      { error: "Unable to delete the document right now." },
      { status: 500 }
    );
  }
}
