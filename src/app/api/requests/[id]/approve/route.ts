import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";

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

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

type ApproveBody = {
  categories?: string[];
  fileIds?: string[];
  note?: string;
  expiresAt?: string | null;
};

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
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
    const approvedCategories = uniqueStrings(body.categories ?? []);
    const approvedFileIds = uniqueStrings(body.fileIds ?? []);
    const note = body.note?.trim() || null;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (approvedCategories.length === 0 && approvedFileIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one category or file to approve." },
        { status: 400 }
      );
    }

    const invalidCategory = approvedCategories.find(
      (category) => !documentCategories.includes(category as DocumentCategory)
    );

    if (invalidCategory) {
      return NextResponse.json(
        { error: `Invalid category: ${invalidCategory}` },
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

    const files =
      approvedFileIds.length > 0
        ? await prisma.horseDocument.findMany({
            where: {
              id: {
                in: approvedFileIds,
              },
              horseId: accessRequest.horseId,
              deletedAt: null,
            },
            select: {
              id: true,
            },
          })
        : [];

    if (files.length !== approvedFileIds.length) {
      return NextResponse.json(
        { error: "One or more approved files are invalid." },
        { status: 400 }
      );
    }

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

      await tx.accessGrantCategory.deleteMany({
        where: {
          accessGrantId: grant.id,
        },
      });

      await tx.accessGrantFile.deleteMany({
        where: {
          accessGrantId: grant.id,
        },
      });

      if (approvedCategories.length > 0) {
        await tx.accessGrantCategory.createMany({
          data: approvedCategories.map((category) => ({
            accessGrantId: grant.id,
            category: category as DocumentCategory,
          })),
        });
      }

      if (files.length > 0) {
        await tx.accessGrantFile.createMany({
          data: files.map((file) => ({
            accessGrantId: grant.id,
            horseDocumentId: file.id,
          })),
        });
      }

      await tx.vaultActivityLog.create({
        data: {
          horseId: accessRequest.horseId,
          accessRequestId: accessRequest.id,
          accessGrantId: grant.id,
          actorUserId: session.user.id,
          activityType: "ACCESS_REQUEST_APPROVED",
          metadata: {
            categories: approvedCategories,
            fileIds: files.map((file) => file.id),
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
