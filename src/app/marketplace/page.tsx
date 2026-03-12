import Image from "next/image";
import Link from "next/link";

import prisma from "@/lib/db/prisma";
import AppHeader from "@/components/layout/app-header";
import MarketplaceFilters from "@/components/marketplace/marketplace-filters";
import HorseMarketplaceCard from "@/components/horses/horse-marketplace-card";

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

  const org = params.org?.trim() || "";
  const breed = params.breed?.trim() || "";
  const maxPrice = params.maxPrice?.trim() || "";

  const horses = await prisma.horse.findMany({
    where: {
      isPublished: true,
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
      ...(org
        ? {
          sellerProfile: {
            displayName: {
              contains: org,
              mode: "insensitive",
            },
          },
        }
        : {}),
    },
    include: {
      sellerProfile: {
        select: {
          displayName: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="buyer" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            Marketplace
          </p>
          <h1 className="mt-2 font-serif text-5xl">Browse Horses</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Explore available horse listings from sellers across the marketplace.
          </p>
        </div>

        <MarketplaceFilters
          defaultOrg={org}
          defaultBreed={breed}
          defaultMaxPrice={maxPrice}
        />

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-stone-600">
            {horses.length} {horses.length === 1 ? "listing" : "listings"} found
          </p>
        </div>

        {horses.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <h2 className="font-serif text-3xl text-stone-900">No listings found</h2>
            <p className="mt-3 text-sm text-stone-500">
              Try adjusting the filters to see more results.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {horses.map((horse) => (
              <HorseMarketplaceCard
                key={horse.id}
                horse={horse}
              />
            ))}

          </div>
        )}
      </section>
    </main>
  );
}