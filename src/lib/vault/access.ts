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

  const fileScope = grant.grantedFiles.map((entry) => entry.horseDocumentId);

  if (fileScope.length === 0) {
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
      id: {
        in: fileScope,
      },
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
