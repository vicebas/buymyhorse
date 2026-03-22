import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import { ensureHorseConversation } from "@/lib/conversations/horse-conversation";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

type ApproveBody = {
  fileIds?: string[];
  note?: string;
  expiresAt?: string | null;
};

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parseExpirationDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return new Date(`${trimmedValue}T00:00:00`);
  }

  return new Date(trimmedValue);
}

export async function POST(req: Request, { params }: RouteContext) {
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
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    const body = (await req.json()) as ApproveBody;
    const approvedFileIds = uniqueStrings(body.fileIds ?? []);
    const note = body.note?.trim() || null;
    const expiresAt = parseExpirationDate(body.expiresAt);

    if (approvedFileIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one file to approve." },
        { status: 400 }
      );
    }

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Invalid expiration date." }, { status: 400 });
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: {
        id,
      },
      include: {
        horse: {
          select: {
            id: true,
            sellerProfileId: true,
          },
        },
        requestedCategories: {
          select: {
            category: true,
          },
        },
      },
    });

    if (!accessRequest) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (accessRequest.horse.sellerProfileId !== seller.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    if (accessRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be approved." },
        { status: 400 }
      );
    }

    const files = await prisma.horseDocument.findMany({
      where: {
        id: {
          in: approvedFileIds,
        },
        horseId: accessRequest.horseId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        category: true,
      },
    });

    if (files.length !== approvedFileIds.length) {
      return NextResponse.json(
        { error: "One or more approved files are invalid." },
        { status: 400 }
      );
    }

    const requestedCategorySet = new Set(
      accessRequest.requestedCategories.map((entry) => entry.category)
    );

    if (
      requestedCategorySet.size > 0 &&
      files.some((file) => !requestedCategorySet.has(file.category))
    ) {
      return NextResponse.json(
        { error: "Approved files must belong to the requested categories." },
        { status: 400 }
      );
    }

    const conversation = await ensureHorseConversation(
      accessRequest.horseId,
      accessRequest.buyerId,
      seller.id
    );

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.accessRequest.update({
        where: {
          id: accessRequest.id,
        },
        data: {
          status: "APPROVED",
          decisionNote: note,
        },
      });

      const grant = await tx.accessGrant.upsert({
        where: {
          horseId_buyerId: {
            horseId: accessRequest.horseId,
            buyerId: accessRequest.buyerId,
          },
        },
        update: {
          grantedBySellerId: seller.id,
          revokedAt: null,
          expiresAt,
          note,
        },
        create: {
          horseId: accessRequest.horseId,
          buyerId: accessRequest.buyerId,
          grantedBySellerId: seller.id,
          expiresAt,
          note,
        },
        select: {
          id: true,
          horseId: true,
          buyerId: true,
          expiresAt: true,
          revokedAt: true,
          note: true,
        },
      });

      await tx.accessGrantFile.deleteMany({
        where: {
          accessGrantId: grant.id,
        },
      });

      await tx.accessGrantFile.createMany({
        data: files.map((file) => ({
          accessGrantId: grant.id,
          horseDocumentId: file.id,
        })),
      });

      await tx.horseMessage.create({
        data: {
          conversationId: conversation.id,
          senderUserId: session.user.id,
          messageType: "GRANT",
          accessGrantId: grant.id,
          metadata: {
            note,
            expiresAt: expiresAt?.toISOString() ?? null,
            files,
            accessGrantId: grant.id,
          },
        },
      });

      await tx.horseConversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          sellerLastReadAt: new Date(),
        },
      });

      await tx.vaultActivityLog.create({
        data: {
          horseId: accessRequest.horseId,
          accessRequestId: accessRequest.id,
          accessGrantId: grant.id,
          actorUserId: session.user.id,
          activityType: "ACCESS_REQUEST_APPROVED",
          metadata: {
            fileIds: files.map((file) => file.id),
            categories: requestedCategorySet.size > 0 ? [...requestedCategorySet] : null,
            expiresAt: expiresAt?.toISOString() ?? null,
            note,
          },
        },
      });

      return {
        request: updatedRequest,
        grant,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Access request approval failed:", error);
    return NextResponse.json(
      { error: "Unable to approve access request right now." },
      { status: 500 }
    );
  }
}
