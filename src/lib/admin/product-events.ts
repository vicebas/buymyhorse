import type { Prisma, ProductEventType } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import type { AdminAnalyticsRange } from "@/lib/admin/analytics";

const PRODUCT_EVENT_TYPES = [
  "SIGNUP",
  "LOGIN",
  "HORSE_CREATION",
  "HORSE_EDIT",
  "DOCUMENT_UPLOAD",
  "GALLERY_UPLOAD",
] as const satisfies readonly ProductEventType[];

type AdminProductEventRow = Prisma.ProductEventGetPayload<{
  select: {
    id: true;
    eventType: true;
    horseId: true;
    horseDocumentId: true;
    horseMediaId: true;
    metadata: true;
    createdAt: true;
    actorUser: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export function getAdminProductEventFilters(params: {
  q?: string;
  horseId?: string;
  eventType?: string;
}): {
  q: string;
  horseId: string;
  eventType: ProductEventType | "all";
} {
  const q = params.q?.trim() || "";
  const horseId = params.horseId?.trim() || "";
  const eventType = PRODUCT_EVENT_TYPES.includes(params.eventType as ProductEventType)
    ? (params.eventType as ProductEventType)
    : "all";

  return {
    q,
    horseId,
    eventType,
  };
}

function buildProductEventWhere({
  range,
  q,
  horseId,
  eventType,
}: {
  range: AdminAnalyticsRange;
  q: string;
  horseId: string;
  eventType: ProductEventType | "all";
}): Prisma.ProductEventWhereInput {
  const where: Prisma.ProductEventWhereInput = {
    createdAt: {
      gte: range.from,
      lte: range.to,
    },
  };

  if (eventType !== "all") {
    where.eventType = eventType;
  }

  if (horseId) {
    where.horseId = {
      contains: horseId,
    };
  }

  if (q) {
    where.actorUser = {
      is: {
        OR: [
          { id: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
    };
  }

  return where;
}

export async function getAdminProductEvents({
  range,
  q,
  horseId,
  eventType,
}: {
  range: AdminAnalyticsRange;
  q: string;
  horseId: string;
  eventType: ProductEventType | "all";
}) {
  const where = buildProductEventWhere({
    range,
    q,
    horseId,
    eventType,
  });

  const countQueries = PRODUCT_EVENT_TYPES.map((type) =>
    prisma.productEvent.count({
      where: {
        ...where,
        eventType: type,
      },
    })
  );

  const results = await Promise.all([
    prisma.productEvent.count({ where }),
    ...countQueries,
    prisma.productEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        eventType: true,
        horseId: true,
        horseDocumentId: true,
        horseMediaId: true,
        metadata: true,
        createdAt: true,
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);
  const totalCount = results[0];
  const events = results[results.length - 1] as AdminProductEventRow[];
  const countResults = results.slice(1, -1) as number[];

  const counts = PRODUCT_EVENT_TYPES.reduce<Record<ProductEventType, number>>((accumulator, type, index) => {
    accumulator[type] = countResults[index] ?? 0;
    return accumulator;
  }, {} as Record<ProductEventType, number>);

  return {
    totalCount,
    counts,
    events,
  };
}
