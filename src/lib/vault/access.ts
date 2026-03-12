import prisma from "@/lib/db/prisma";

type BuyerHorseAccessStatus = "NONE" | "ACTIVE" | "EXPIRED" | "REVOKED";

export async function getBuyerHorseAccess(buyerId: string, horseId: string) {
  const grant = await prisma.accessGrant.findUnique({
    where: {
      horseId_buyerId: {
        horseId,
        buyerId,
      },
    },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
        },
      },
      grantedCategories: {
        select: {
          category: true,
        },
      },
      grantedFiles: {
        select: {
          horseDocumentId: true,
        },
      },
    },
  });

  if (!grant) {
    return {
      status: "NONE" as BuyerHorseAccessStatus,
      horse: null,
      grant: null,
      documents: [],
    };
  }

  if (grant.revokedAt) {
    return {
      status: "REVOKED" as BuyerHorseAccessStatus,
      horse: grant.horse,
      grant,
      documents: [],
    };
  }

  if (grant.expiresAt && grant.expiresAt <= new Date()) {
    return {
      status: "EXPIRED" as BuyerHorseAccessStatus,
      horse: grant.horse,
      grant,
      documents: [],
    };
  }

  const categoryScope = grant.grantedCategories.map((entry) => entry.category);
  const fileScope = grant.grantedFiles.map((entry) => entry.horseDocumentId);

  if (categoryScope.length === 0 && fileScope.length === 0) {
    return {
      status: "ACTIVE" as BuyerHorseAccessStatus,
      horse: grant.horse,
      grant,
      documents: [],
    };
  }

  const documents = await prisma.horseDocument.findMany({
    where: {
      horseId,
      deletedAt: null,
      OR: [
        ...(categoryScope.length > 0
          ? [
              {
                category: {
                  in: categoryScope,
                },
              },
            ]
          : []),
        ...(fileScope.length > 0
          ? [
              {
                id: {
                  in: fileScope,
                },
              },
            ]
          : []),
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    status: "ACTIVE" as BuyerHorseAccessStatus,
    horse: grant.horse,
    grant,
    documents,
  };
}
