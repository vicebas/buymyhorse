import prisma from "@/lib/db/prisma";

export type BuyerHorseAccessStatus = "NONE" | "ACTIVE" | "EXPIRED" | "REVOKED";

async function loadAccessibleDocuments(horseId: string, fileScope: string[]) {
  if (fileScope.length === 0) {
    return [];
  }

  return prisma.horseDocument.findMany({
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
}

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
  const documents = await loadAccessibleDocuments(horseId, fileScope);

  return {
    status: "ACTIVE" as BuyerHorseAccessStatus,
    horse: grant.horse,
    grant,
    documents,
  };
}

export async function getBuyerGrantAccess(grantId: string, buyerId: string) {
  const grant = await prisma.accessGrant.findUnique({
    where: {
      id: grantId,
    },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
        },
      },
      grantedBySeller: {
        select: {
          id: true,
          displayName: true,
        },
      },
      grantedFiles: {
        select: {
          horseDocumentId: true,
        },
      },
    },
  });

  if (!grant || grant.buyerId !== buyerId) {
    return null;
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
  const documents = await loadAccessibleDocuments(grant.horseId, fileScope);

  return {
    status: "ACTIVE" as BuyerHorseAccessStatus,
    horse: grant.horse,
    grant,
    documents,
  };
}
