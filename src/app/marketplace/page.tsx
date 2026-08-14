import { getServerSession } from "next-auth";

import prisma from "@/lib/db/prisma";
import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import MainHeader from "@/components/layout/main-header";
import { authOptions } from "@/lib/auth/options";
import MarketplaceFilters from "@/components/marketplace/marketplace-filters";
import HorseMarketplaceCard from "@/components/horses/horse-marketplace-card";
import { featuredHorseSelect, sortHorsesByFeaturedPriority } from "@/lib/horses/featured";
import { getActiveListingOptions } from "@/lib/horses/listing-options";
import { isHorseListingAvailable, mapHorseToCard } from "@/lib/horses/listing-data";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{
    breed?: string;
    discipline?: string;
    pricingVisibility?: string;
    saleType?: string;
    sex?: string;
    location?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  const breed = params.breed?.trim() || "";
  const discipline = params.discipline?.trim() || "";
  const pricingVisibility = params.pricingVisibility?.trim() || "";
  const saleType = params.saleType?.trim() || "";
  const sex = params.sex?.trim() || "";
  const location = params.location?.trim() || "";

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

  const savedHorseIds: Set<string> = session?.user?.id
    ? new Set(
        (await prisma.savedHorse.findMany({
          where: { userId: session.user.id },
          select: { horseId: true },
        })).map((s) => s.horseId)
      )
    : new Set();

  const listingOptions = await getActiveListingOptions();

  const horses = await prisma.horse.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      adminDisabledAt: null,
      sellerProfile: {
        adminDisabledAt: null,
      },
      ...(breed ? { breedOptionId: breed } : {}),
      ...(discipline ? { primaryDisciplineId: discipline } : {}),
      ...(pricingVisibility ? { pricingVisibilityOptionId: pricingVisibility } : {}),
      ...(saleType
        ? {
            saleTypes: {
              some: {
                saleTypeOptionId: saleType,
              },
            },
          }
        : {}),
      ...(sex ? { sexOptionId: sex } : {}),
      ...(location
        ? {
            location: {
              contains: location,
              mode: "insensitive",
            },
          }
        : {}),
    },
    select: featuredHorseSelect,
    orderBy: [{ updatedAt: "desc" }],
  });

  const visibleHorses = sortHorsesByFeaturedPriority(
    horses.filter((horse) => isHorseListingAvailable(horse))
  );

  const horseCards = visibleHorses.map((horse) => ({
    ...mapHorseToCard(horse),
    isSaved: savedHorseIds.has(horse.id),
  }));

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {session?.user?.id ? (
        <ResolvedAppHeader variant={sellerProfile ? "seller" : "buyer"} />
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
          defaultBreed={breed}
          defaultDiscipline={discipline}
          defaultPricingVisibility={pricingVisibility}
          defaultSaleType={saleType}
          defaultSex={sex}
          defaultLocation={location}
          options={listingOptions}
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
                isSaved={horse.isSaved}
                isLoggedIn={Boolean(session?.user?.id)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
