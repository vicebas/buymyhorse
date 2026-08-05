type SharedAccessOrigin = "DIRECT_SHARE" | "APPROVED_REQUEST" | "UNKNOWN";

type SharedAccessMetadata = {
  source?: unknown;
};

type SharedAccessGrantRecord = {
  id: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  buyer: {
    id: string;
    name: string | null;
    email: string | null;
  };
  grantedFiles: Array<{
    horseDocumentId: string;
    horseDocument: {
      id: string;
      title: string;
      category: string;
      deletedAt: Date | null;
    } | null;
  }>;
  messages: Array<{
    metadata: unknown;
    createdAt: Date;
  }>;
  vaultActivities: Array<{
    metadata: unknown;
    createdAt: Date;
  }>;
};

export type SellerHorseVaultSharedAccessItem = {
  grantId: string;
  buyer: {
    id: string;
    name: string | null;
    email: string | null;
    label: string;
  };
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  sharedAt: string;
  expiresAt: string | null;
  note: string | null;
  origin: SharedAccessOrigin;
  originLabel: string;
  documents: Array<{
    id: string;
    title: string;
    category: string;
  }>;
  canRevoke: boolean;
};

function readSource(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = metadata as SharedAccessMetadata;

  return value.source === "DIRECT_SHARE" ? "DIRECT_SHARE" : null;
}

function resolveOrigin(grant: SharedAccessGrantRecord): SharedAccessOrigin {
  const latestMessage = grant.messages[0];
  if (readSource(latestMessage?.metadata) === "DIRECT_SHARE") {
    return "DIRECT_SHARE";
  }

  const latestActivity = grant.vaultActivities[0];
  if (readSource(latestActivity?.metadata) === "DIRECT_SHARE") {
    return "DIRECT_SHARE";
  }

  if (latestActivity) {
    return "APPROVED_REQUEST";
  }

  return "UNKNOWN";
}

function getOriginLabel(origin: SharedAccessOrigin) {
  switch (origin) {
    case "DIRECT_SHARE":
      return "Direct share";
    case "APPROVED_REQUEST":
      return "Approved request";
    default:
      return "Shared access";
  }
}

function getBuyerLabel(buyer: SharedAccessGrantRecord["buyer"]) {
  return buyer.name || buyer.email || "Unnamed buyer";
}

export function mapSellerHorseVaultSharedAccess(
  grants: SharedAccessGrantRecord[]
): SellerHorseVaultSharedAccessItem[] {
  return grants.map((grant) => {
    const origin = resolveOrigin(grant);
    const documents = grant.grantedFiles
      .map((entry) => entry.horseDocument)
      .filter(
        (
          document
        ): document is NonNullable<SharedAccessGrantRecord["grantedFiles"][number]["horseDocument"]> =>
          document != null && document.deletedAt == null
      )
      .map((document) => ({
        id: document.id,
        title: document.title,
        category: document.category,
      }));

    return {
      grantId: grant.id,
      buyer: {
        ...grant.buyer,
        label: getBuyerLabel(grant.buyer),
      },
      status: grant.revokedAt ? "REVOKED" : grant.expiresAt && grant.expiresAt <= new Date() ? "EXPIRED" : "ACTIVE",
      sharedAt: grant.updatedAt.toISOString(),
      expiresAt: grant.expiresAt?.toISOString() ?? null,
      note: grant.note,
      origin,
      originLabel: getOriginLabel(origin),
      documents,
      canRevoke: true,
    };
  });
}
