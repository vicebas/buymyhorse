import Image from "next/image";
import Link from "next/link";

import prisma from "@/lib/db/prisma";
import AppHeader from "@/components/layout/app-header";
import MarketplaceFilters from "@/components/marketplace/marketplace-filters";

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
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {horses.map((horse) => (
              <Link
                key={horse.id}
                href={`/horses/${horse.id}`}
                className="block rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <Image
                  src={horse.image || "/img/default-horse.png"}
                  alt={horse.name}
                  width={700}
                  height={480}
                  className="h-64 w-full rounded-2xl object-cover"
                />

                <div className="mt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">
                        {horse.name}
                      </h2>
                      <p className="mt-1 text-sm text-stone-500">
                        {horse.breed || "Breed not specified"}
                      </p>
                    </div>

                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                      {horse.sellerProfile.displayName}
                    </span>
                  </div>

                  <p className="mt-4 font-serif text-2xl text-stone-900">
                    {horse.price
                      ? `$${Number(horse.price).toLocaleString()}`
                      : "Price on request"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}