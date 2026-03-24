import { horseListingInclude } from "@/lib/horses/listing-data";

export const featuredHorseInclude = {
  ...horseListingInclude,
  featureMetrics: true,
  _count: {
    select: {
      savedByUsers: true,
    },
  },
  savedByUsers: {
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
    select: {
      createdAt: true,
    },
  },
} as const;

type FeaturedHorseCandidate = {
  isPublished: boolean;
  isPlatformFeatured?: boolean | null;
  platformFeaturedAt?: Date | null;
  updatedAt: Date;
  featureMetrics?: {
    profileViews: number;
    clickThroughs: number;
    lastProfileViewAt: Date | null;
    lastClickThroughAt: Date | null;
  } | null;
  _count?: {
    savedByUsers: number;
  };
  savedByUsers?: Array<{
    createdAt: Date;
  }>;
};

export function getRecentEngagementScore(horse: FeaturedHorseCandidate) {
  const latestActivity = [
    horse.updatedAt,
    horse.featureMetrics?.lastProfileViewAt ?? null,
    horse.featureMetrics?.lastClickThroughAt ?? null,
    horse.savedByUsers?.[0]?.createdAt ?? null,
  ]
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!latestActivity) {
    return 0;
  }

  const ageInDays = (Date.now() - latestActivity.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays <= 2) return 100;
  if (ageInDays <= 7) return 75;
  if (ageInDays <= 14) return 50;
  if (ageInDays <= 30) return 25;
  return 0;
}

export function getFeaturedHorseScore(horse: FeaturedHorseCandidate) {
  return (
    (horse.featureMetrics?.profileViews || 0) * 0.35 +
    (horse._count?.savedByUsers || 0) * 0.3 +
    (horse.featureMetrics?.clickThroughs || 0) * 0.2 +
    getRecentEngagementScore(horse) * 0.15
  );
}

export function getFeaturedHorses<T extends FeaturedHorseCandidate>(horses: T[], limit = 6) {
  const manualFeatured = horses
    .filter((horse) => horse.isPublished && horse.isPlatformFeatured)
    .sort((a, b) => (b.platformFeaturedAt?.getTime() || 0) - (a.platformFeaturedAt?.getTime() || 0));

  const meritFeatured = horses
    .filter((horse) => horse.isPublished && !horse.isPlatformFeatured)
    .sort((a, b) => {
      const scoreDiff = getFeaturedHorseScore(b) - getFeaturedHorseScore(a);

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  return [...manualFeatured, ...meritFeatured].slice(0, limit);
}

export function sortHorsesByFeaturedPriority<T extends FeaturedHorseCandidate>(horses: T[]) {
  const featuredIds = new Set(getFeaturedHorses(horses, horses.length).map((horse) => horse));

  return [...horses].sort((a, b) => {
    const aIsFeatured = featuredIds.has(a);
    const bIsFeatured = featuredIds.has(b);

    if (aIsFeatured !== bIsFeatured) {
      return aIsFeatured ? -1 : 1;
    }

    if (a.isPlatformFeatured !== b.isPlatformFeatured) {
      return a.isPlatformFeatured ? -1 : 1;
    }

    const scoreDiff = getFeaturedHorseScore(b) - getFeaturedHorseScore(a);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}
