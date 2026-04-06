import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import type { AdminAnalyticsRange } from "@/lib/admin/analytics";

export function getAdminBackendErrorFilters(params: {
  q?: string;
  route?: string;
  status?: string;
}): {
  q: string;
  route: string;
  status: "all" | "open" | "resolved";
} {
  const q = params.q?.trim() || "";
  const route = params.route?.trim() || "";
  const status =
    params.status === "open" || params.status === "resolved"
      ? params.status
      : "all";

  return { q, route, status };
}

function buildBackendErrorWhere({
  range,
  q,
  route,
  status,
}: {
  range: AdminAnalyticsRange;
  q: string;
  route: string;
  status: "all" | "open" | "resolved";
}): Prisma.BackendErrorWhereInput {
  const where: Prisma.BackendErrorWhereInput = {
    createdAt: {
      gte: range.from,
      lte: range.to,
    },
  };

  if (status === "open") {
    where.resolvedAt = null;
  } else if (status === "resolved") {
    where.resolvedAt = { not: null };
  }

  if (route) {
    where.route = { contains: route, mode: "insensitive" };
  }

  if (q) {
    where.OR = [
      { message: { contains: q, mode: "insensitive" } },
      { route: { contains: q, mode: "insensitive" } },
      { userId: { contains: q } },
    ];
  }

  return where;
}

export async function getAdminBackendErrors({
  range,
  q,
  route,
  status,
}: {
  range: AdminAnalyticsRange;
  q: string;
  route: string;
  status: "all" | "open" | "resolved";
}) {
  const where = buildBackendErrorWhere({ range, q, route, status });

  const [totalCount, openCount, resolvedCount, errors] = await Promise.all([
    prisma.backendError.count({ where }),
    prisma.backendError.count({ where: { ...where, resolvedAt: null } }),
    prisma.backendError.count({ where: { ...where, resolvedAt: { not: null } } }),
    prisma.backendError.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        message: true,
        stack: true,
        route: true,
        method: true,
        userId: true,
        metadata: true,
        resolvedAt: true,
        createdAt: true,
      },
    }),
  ]);

  return { totalCount, openCount, resolvedCount, errors };
}

export type AdminBackendErrorRow = Awaited<
  ReturnType<typeof getAdminBackendErrors>
>["errors"][number];
