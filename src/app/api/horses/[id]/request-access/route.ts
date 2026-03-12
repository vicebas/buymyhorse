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

type RequestBody = {
  message?: string;
  intendedUse?: string;
  categories?: string[];
  fileIds?: string[];
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

    const body = (await req.json()) as RequestBody;
    const message = body.message?.trim() || null;
    const intendedUse = body.intendedUse?.trim() || null;
    const requestedCategories = uniqueStrings(body.categories ?? []);
    const requestedFileIds = uniqueStrings(body.fileIds ?? []);

    if (requestedCategories.length === 0 && requestedFileIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one category or file to request." },
        { status: 400 }
      );
    }

    const invalidCategory = requestedCategories.find(
      (category) => !documentCategories.includes(category as DocumentCategory)
    );

    if (invalidCategory) {
      return NextResponse.json(
        { error: `Invalid category: ${invalidCategory}` },
        { status: 400 }
      );
    }

    const horse = await prisma.horse.findFirst({
      where: {
        id,
        isPublished: true,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        sellerProfileId: true,
      },
    });

    if (!horse) {
      return NextResponse.json({ error: "Horse not found." }, { status: 404 });
    }

    const buyer = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        sellerProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found." }, { status: 404 });
    }

    if (buyer.sellerProfile?.id === horse.sellerProfileId) {
      return NextResponse.json(
        { error: "You cannot request access to your own horse." },
        { status: 400 }
      );
    }

    const files =
      requestedFileIds.length > 0
        ? await prisma.horseDocument.findMany({
            where: {
              id: {
                in: requestedFileIds,
              },
              horseId: horse.id,
              deletedAt: null,
            },
            select: {
              id: true,
            },
          })
        : [];

    if (files.length !== requestedFileIds.length) {
      return NextResponse.json(
        { error: "One or more requested files are invalid." },
        { status: 400 }
      );
    }

    const accessRequest = await prisma.accessRequest.create({
      data: {
        horseId: horse.id,
        buyerId: session.user.id,
        message,
        intendedUse,
        requestedCategories: {
          create: requestedCategories.map((category) => ({
            category: category as DocumentCategory,
          })),
        },
        requestedFiles: {
          create: files.map((file) => ({
            horseDocumentId: file.id,
          })),
        },
      },
      select: {
        id: true,
        status: true,
        message: true,
        intendedUse: true,
        createdAt: true,
        requestedCategories: {
          select: {
            category: true,
          },
        },
        requestedFiles: {
          select: {
            horseDocumentId: true,
          },
        },
      },
    });

    await prisma.vaultActivityLog.create({
      data: {
        horseId: horse.id,
        accessRequestId: accessRequest.id,
        actorUserId: session.user.id,
        activityType: "ACCESS_REQUEST_CREATED",
        metadata: {
          categories: requestedCategories,
          fileIds: files.map((file) => file.id),
          intendedUse,
        },
      },
    });

    return NextResponse.json(accessRequest, { status: 201 });
  } catch (error) {
    console.error("Horse access request failed:", error);
    return NextResponse.json(
      { error: "Unable to submit access request right now." },
      { status: 500 }
    );
  }
}
