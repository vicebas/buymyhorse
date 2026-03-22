import { getServerSession } from "next-auth";

import prisma from "@/lib/db/prisma";
import AppHeader from "@/components/layout/app-header";
import MainHeader from "@/components/layout/main-header";
import { authOptions } from "@/lib/auth/options";
import MarketplaceFilters from "@/components/marketplace/marketplace-filters";
import HorseMarketplaceCard from "@/components/horses/horse-marketplace-card";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string;
    breed?: string;
    maxPrice?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  const org = params.org?.trim() || "";
  const breed = params.breed?.trim() || "";
  const maxPrice = params.maxPrice?.trim() || "";

  const sellerProfile = session?.user?.id
    ? await prisma.sellerProfile.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      })
    : null;

  const horses = await prisma.horse.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      adminDisabledAt: null,
      sellerProfile: {
        adminDisabledAt: null,
        ...(org
          ? {
              displayName: {
                contains: org,
                mode: "insensitive",
              },
            }
          : {}),
      },
      ...(breed
        ? {
          breed: {
            contains: breed,
            mode: "insensitive",
          },
        }
        : {}),
      ...(maxPrice
        ? {
          price: {
            lte: Number(maxPrice),
          },
        }
        : {}),
    },
    include: {
      sellerProfile: {
        select: {
          displayName: true,
          slug: true,
          plan: true,
          billingCadence: true,
          billingStatus: true,
          adminPlanOverride: true,
          adminBillingCadenceOverride: true,
          adminBillingStatusOverride: true,
          adminBillingOverrideReason: true,
          adminBillingOverrideExpiresAt: true,
          trialEndsAt: true,
          currentPeriodEndsAt: true,
          adminDisabledAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const visibleHorses = horses.filter((horse) => isHorsePubliclyVisible(horse));

  const horseCards = visibleHorses.map((horse) => ({
    id: horse.id,
    name: horse.name,
    breed: horse.breed,
    age: horse.age,
    height: horse.height,
    gender: horse.gender,
    discipline: horse.discipline,
    level: horse.level,
    price: horse.price ? Number(horse.price) : null,
    image: horse.image,
    location: horse.location,
    saleStatus: horse.saleStatus,
    sellerProfile: {
      displayName: horse.sellerProfile.displayName,
    },
  }));

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {session?.user?.id ? (
        <AppHeader variant={sellerProfile ? "seller" : "buyer"} />
      ) : (
        <MainHeader activeItem="marketplace" />
      )}

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            Marketplace
          </p>
          <h1 className="mt-2 text-5xl font-extrabold">Browse Horses</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
            Explore available horse listings from barns across the marketplace.
          </p>
        </div>

        <MarketplaceFilters
          defaultOrg={org}
          defaultBreed={breed}
          defaultMaxPrice={maxPrice}
        />

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-[color:var(--foreground-soft)]">
            {visibleHorses.length} {visibleHorses.length === 1 ? "listing" : "listings"} found
          </p>
        </div>

        {visibleHorses.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-12 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-3xl font-extrabold text-[color:var(--foreground-strong)]">No listings found</h2>
            <p className="mt-3 text-sm text-[color:var(--foreground-soft)]">
              Try adjusting the filters to see more results.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {horseCards.map((horse) => (
              <HorseMarketplaceCard
                key={horse.id}
                horse={horse}
                variant="marketplace"
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
