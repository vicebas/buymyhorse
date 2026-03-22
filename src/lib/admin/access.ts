import type { AccessRequestStatus, Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import type { AdminAnalyticsRange } from "@/lib/admin/analytics";

export type AdminAccessStatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "denied"
  | "revoked"
  | "expired";

export type AdminAccessActivityFilter =
  | "all"
  | "ACCESS_REQUEST_CREATED"
  | "ACCESS_REQUEST_APPROVED"
  | "ACCESS_REQUEST_DENIED"
  | "ACCESS_GRANT_REVOKED";

const STATUS_FILTERS = new Set<AdminAccessStatusFilter>([
  "all",
  "pending",
  "approved",
  "denied",
  "revoked",
  "expired",
]);

const ACTIVITY_FILTERS = new Set<AdminAccessActivityFilter>([
  "all",
  "ACCESS_REQUEST_CREATED",
  "ACCESS_REQUEST_APPROVED",
  "ACCESS_REQUEST_DENIED",
  "ACCESS_GRANT_REVOKED",
]);

const adminAccessRequestHistorySelect = {
  id: true,
  status: true,
  message: true,
  decisionNote: true,
  createdAt: true,
  updatedAt: true,
  horse: {
    select: {
      id: true,
      name: true,
      sellerProfile: {
        select: {
          displayName: true,
          slug: true,
        },
      },
    },
  },
  buyer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.AccessRequestSelect;

export type AdminAccessRequestHistoryItem = Prisma.AccessRequestGetPayload<{
  select: typeof adminAccessRequestHistorySelect;
}>;

function containsInsensitive(value: string) {
  return {
    contains: value,
    mode: "insensitive" as const,
  };
}

function buildRequestSearchWhere(q: string) {
  if (!q) {
    return {};
  }

  return {
    OR: [
      { horse: { name: containsInsensitive(q) } },
      { horse: { sellerProfile: { displayName: containsInsensitive(q) } } },
      { horse: { sellerProfile: { slug: containsInsensitive(q) } } },
      { buyer: { name: containsInsensitive(q) } },
      { buyer: { email: containsInsensitive(q) } },
    ],
  };
}

function buildGrantSearchWhere(q: string) {
  if (!q) {
    return {};
  }

  return {
    OR: [
      { horse: { name: containsInsensitive(q) } },
      { horse: { sellerProfile: { displayName: containsInsensitive(q) } } },
      { horse: { sellerProfile: { slug: containsInsensitive(q) } } },
      { buyer: { name: containsInsensitive(q) } },
      { buyer: { email: containsInsensitive(q) } },
    ],
  };
}

function buildLogSearchWhere(q: string) {
  if (!q) {
    return {};
  }

  return {
    OR: [
      { horse: { name: containsInsensitive(q) } },
      { horse: { sellerProfile: { displayName: containsInsensitive(q) } } },
      { horse: { sellerProfile: { slug: containsInsensitive(q) } } },
      { accessRequest: { buyer: { name: containsInsensitive(q) } } },
      { accessRequest: { buyer: { email: containsInsensitive(q) } } },
      { accessGrant: { buyer: { name: containsInsensitive(q) } } },
      { accessGrant: { buyer: { email: containsInsensitive(q) } } },
    ],
  };
}

function buildMessageSearchWhere(q: string) {
  if (!q) {
    return {};
  }

  return {
    conversation: {
      OR: [
        { horse: { name: containsInsensitive(q) } },
        { sellerProfile: { displayName: containsInsensitive(q) } },
        { buyer: { name: containsInsensitive(q) } },
        { buyer: { email: containsInsensitive(q) } },
      ],
    },
  };
}

function getRequestStatusValue(status: AdminAccessStatusFilter) {
  switch (status) {
    case "pending":
      return "PENDING" satisfies AccessRequestStatus;
    case "approved":
      return "APPROVED" satisfies AccessRequestStatus;
    case "denied":
      return "DENIED" satisfies AccessRequestStatus;
    case "revoked":
      return "REVOKED" satisfies AccessRequestStatus;
    case "expired":
      return "EXPIRED" satisfies AccessRequestStatus;
    default:
      return undefined;
  }
}

export function getAdminAccessFilters(params: {
  q?: string;
  status?: string;
  activity?: string;
}) {
  const q = params.q?.trim() || "";
  const status = STATUS_FILTERS.has(params.status as AdminAccessStatusFilter)
    ? (params.status as AdminAccessStatusFilter)
    : "all";
  const activity = ACTIVITY_FILTERS.has(params.activity as AdminAccessActivityFilter)
    ? (params.activity as AdminAccessActivityFilter)
    : "all";

  return {
    q,
    status,
    activity,
  };
}

export async function getAdminAccessConsoleData({
  range,
  q,
  status,
  activity,
}: {
  range: AdminAnalyticsRange;
  q: string;
  status: AdminAccessStatusFilter;
  activity: AdminAccessActivityFilter;
}) {
  const now = new Date();
  const requestStatus = getRequestStatusValue(status);

  const activeGrantWhere = {
    ...buildGrantSearchWhere(q),
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  const requestRangeWhere = {
    ...buildRequestSearchWhere(q),
    createdAt: {
      gte: range.from,
      lte: range.to,
    },
  };

  const logRangeWhere = {
    ...buildLogSearchWhere(q),
    createdAt: {
      gte: range.from,
      lte: range.to,
    },
  };

  const messageRangeWhere = {
    ...buildMessageSearchWhere(q),
    createdAt: {
      gte: range.from,
      lte: range.to,
    },
  };

  const [
    activeGrantCount,
    pendingRequestCount,
    requestsCreatedCount,
    approvalsCount,
    messagesSentCount,
    activeGrants,
    requestHistory,
    accessLog,
  ] = await Promise.all([
    prisma.accessGrant.count({
      where: activeGrantWhere,
    }),
    prisma.accessRequest.count({
      where: {
        ...buildRequestSearchWhere(q),
        status: "PENDING",
      },
    }),
    prisma.accessRequest.count({
      where: requestRangeWhere,
    }),
    prisma.vaultActivityLog.count({
      where: {
        ...logRangeWhere,
        activityType: "ACCESS_REQUEST_APPROVED",
      },
    }),
    prisma.horseMessage.count({
      where: messageRangeWhere,
    }),
    prisma.accessGrant.findMany({
      where: activeGrantWhere,
      orderBy: [{ createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        note: true,
        horse: {
          select: {
            id: true,
            name: true,
            sellerProfile: {
              select: {
                displayName: true,
                slug: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            grantedFiles: true,
          },
        },
      },
    }),
    prisma.accessRequest.findMany({
      where: {
        ...requestRangeWhere,
        ...(requestStatus ? { status: requestStatus } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      select: adminAccessRequestHistorySelect,
    }),
    prisma.vaultActivityLog.findMany({
      where: {
        ...logRangeWhere,
        ...(activity !== "all" ? { activityType: activity } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        createdAt: true,
        activityType: true,
        metadata: true,
        horse: {
          select: {
            id: true,
            name: true,
            sellerProfile: {
              select: {
                displayName: true,
                slug: true,
              },
            },
          },
        },
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        accessRequest: {
          select: {
            id: true,
            status: true,
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        accessGrant: {
          select: {
            id: true,
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    summary: {
      activeGrantCount,
      pendingRequestCount,
      requestsCreatedCount,
      approvalsCount,
      messagesSentCount,
    },
    activeGrants,
    requestHistory,
    accessLog,
  };
}
