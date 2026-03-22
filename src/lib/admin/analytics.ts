import prisma from "@/lib/db/prisma";

export type AdminAnalyticsRangeKey = "7d" | "30d" | "90d" | "custom";

export interface AdminAnalyticsRange {
  rangeKey: AdminAnalyticsRangeKey;
  from: Date;
  to: Date;
  fromInput: string;
  toInput: string;
  label: string;
}

export interface AdminTrendPoint {
  date: string;
  label: string;
  value: number;
}

interface TimestampRow {
  createdAt: Date;
}


const RANGE_DAYS: Record<Exclude<AdminAnalyticsRangeKey, "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function startOfUtcDay(date: Date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function endOfUtcDay(date: Date) {
  const value = new Date(date);
  value.setUTCHours(23, 59, 59, 999);
  return value;
}

function addUtcDays(date: Date, days: number) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseInputDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatRangeLabel(rangeKey: AdminAnalyticsRangeKey, from: Date, to: Date) {
  if (rangeKey === "7d") return "Last 7 Days";
  if (rangeKey === "30d") return "Last 30 Days";
  if (rangeKey === "90d") return "Last 90 Days";
  return `${dateFormatter.format(from)} - ${dateFormatter.format(to)}`;
}

function buildPresetRange(rangeKey: Exclude<AdminAnalyticsRangeKey, "custom">) {
  const today = startOfUtcDay(new Date());
  const from = addUtcDays(today, -(RANGE_DAYS[rangeKey] - 1));
  const to = endOfUtcDay(today);

  return {
    rangeKey,
    from,
    to,
    fromInput: formatDateInput(from),
    toInput: formatDateInput(to),
    label: formatRangeLabel(rangeKey, from, to),
  } satisfies AdminAnalyticsRange;
}

export function getAdminAnalyticsRange(params: {
  range?: string;
  from?: string;
  to?: string;
}): AdminAnalyticsRange {
  const requestedRange = params.range;

  if (requestedRange === "custom") {
    const from = parseInputDate(params.from);
    const to = parseInputDate(params.to);

    if (from && to && from.getTime() <= to.getTime()) {
      const normalizedFrom = startOfUtcDay(from);
      const normalizedTo = endOfUtcDay(to);

      return {
        rangeKey: "custom",
        from: normalizedFrom,
        to: normalizedTo,
        fromInput: formatDateInput(normalizedFrom),
        toInput: formatDateInput(normalizedTo),
        label: formatRangeLabel("custom", normalizedFrom, normalizedTo),
      };
    }
  }

  if (requestedRange === "30d" || requestedRange === "90d") {
    return buildPresetRange(requestedRange);
  }

  return buildPresetRange("7d");
}

function buildEmptySeries(from: Date, to: Date) {
  const points: AdminTrendPoint[] = [];
  const cursor = startOfUtcDay(from);
  const limit = startOfUtcDay(to);

  while (cursor.getTime() <= limit.getTime()) {
    points.push({
      date: toDayKey(cursor),
      label: dateFormatter.format(cursor),
      value: 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return points;
}

function buildSeries(rows: TimestampRow[], from: Date, to: Date) {
  const series = buildEmptySeries(from, to);
  const index = new Map(series.map((point, idx) => [point.date, idx]));

  for (const row of rows) {
    const key = toDayKey(row.createdAt);
    const pointIndex = index.get(key);

    if (pointIndex !== undefined) {
      series[pointIndex] = {
        ...series[pointIndex],
        value: series[pointIndex].value + 1,
      };
    }
  }

  return series;
}

function rankByCount<T extends string>(rows: T[]) {
  const counts = new Map<T, number>();

  for (const value of rows) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export async function getAdminDashboardAnalytics(range: AdminAnalyticsRange) {
  const [
    totalUsers,
    totalBarns,
    totalHorses,
    totalEquiTags,
    usersInRange,
    barnsInRange,
    horsesInRange,
    equiTagsInRange,
    equiTagVisitsInRange,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.sellerProfile.count(),
    prisma.horse.count({ where: { deletedAt: null } }),
    prisma.equiTag.count(),
    prisma.user.findMany({
      where: { createdAt: { gte: range.from, lte: range.to } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sellerProfile.findMany({
      where: { createdAt: { gte: range.from, lte: range.to } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.horse.findMany({
      where: { createdAt: { gte: range.from, lte: range.to }, deletedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.equiTag.findMany({
      where: { createdAt: { gte: range.from, lte: range.to } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.equiTagVisit.findMany({
      where: { createdAt: { gte: range.from, lte: range.to } },
      select: {
        createdAt: true,
        equiTagId: true,
        ownerSellerProfileId: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const topTagCounts = rankByCount(equiTagVisitsInRange.map((row) => row.equiTagId)).slice(0, 5);
  const topBarnCounts = rankByCount(equiTagVisitsInRange.map((row) => row.ownerSellerProfileId)).slice(0, 5);

  const topTagIds = topTagCounts.map(([id]) => id);
  const topBarnIds = topBarnCounts.map(([id]) => id);

  const [topTagRecords, topBarnRecords] = await Promise.all([
    topTagIds.length
      ? prisma.equiTag.findMany({
          where: { id: { in: topTagIds } },
          select: {
            id: true,
            code: true,
            attachedEntityType: true,
            attachedBarn: {
              select: {
                displayName: true,
                slug: true,
              },
            },
            attachedHorse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    topBarnIds.length
      ? prisma.sellerProfile.findMany({
          where: { id: { in: topBarnIds } },
          select: {
            id: true,
            displayName: true,
            slug: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const topTagMap = new Map(topTagRecords.map((record) => [record.id, record]));
  const topBarnMap = new Map(topBarnRecords.map((record) => [record.id, record]));

  return {
    totals: {
      users: totalUsers,
      barns: totalBarns,
      horses: totalHorses,
      equiTags: totalEquiTags,
      equiTagUsesInRange: equiTagVisitsInRange.length,
    },
    newInRange: {
      users: usersInRange.length,
      barns: barnsInRange.length,
      horses: horsesInRange.length,
      equiTags: equiTagsInRange.length,
    },
    series: {
      users: buildSeries(usersInRange, range.from, range.to),
      barns: buildSeries(barnsInRange, range.from, range.to),
      horses: buildSeries(horsesInRange, range.from, range.to),
      equiTags: buildSeries(equiTagsInRange, range.from, range.to),
      equiTagUses: buildSeries(equiTagVisitsInRange, range.from, range.to),
    },
    topBarns: topBarnCounts.map(([id, hits]) => {
      const barn = topBarnMap.get(id);

      return {
        id,
        hits,
        displayName: barn?.displayName || "Unknown barn",
        slug: barn?.slug || null,
      };
    }),
    topEquiTags: topTagCounts.map(([id, hits]) => {
      const tag = topTagMap.get(id);
      const targetLabel =
        tag?.attachedEntityType === "BARN" && tag.attachedBarn
          ? `Attached to ${tag.attachedBarn.displayName}`
          : tag?.attachedEntityType === "HORSE" && tag.attachedHorse
            ? `Attached to ${tag.attachedHorse.name}`
            : "Currently unassigned";

      return {
        id,
        hits,
        code: tag?.code || "Unknown tag",
        href: tag?.code ? `/eq/${tag.code}` : null,
        targetLabel,
      };
    }),
  };
}
