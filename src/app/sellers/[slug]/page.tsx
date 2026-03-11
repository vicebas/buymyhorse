import prisma from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import AppHeader from "@/components/layout/app-header";

export default async function PublicSellerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const seller = await prisma.sellerProfile.findUnique({
    where: {
      slug,
    },
    include: {
      horses: {
        where: {
          isPublished: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!seller) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="buyer" />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:items-start">
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50">
              <Image
                src={seller.logo || "/img/default-horse.png"}
                alt={seller.displayName}
                width={400}
                height={400}
                className="h-44 w-full object-cover"
              />
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
                Seller Profile
              </p>

              <h1 className="mt-2 font-serif text-5xl">{seller.displayName}</h1>

              {seller.headline ? (
                <p className="mt-3 text-lg text-stone-600">{seller.headline}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-stone-500">
                {seller.location ? <span>{seller.location}</span> : null}
                {seller.website ? (
                  <a
                    href={seller.website}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4"
                  >
                    Visit website
                  </a>
                ) : null}
              </div>

              <div className="mt-6 max-w-3xl text-base leading-8 text-stone-700">
                {seller.bio ? (
                  <p>{seller.bio}</p>
                ) : (
                  <p className="text-stone-500">No seller bio available yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Published Horses
            </p>
            <h2 className="mt-2 font-serif text-3xl">Available Listings</h2>
          </div>

          {seller.horses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
              <p className="text-lg text-stone-700">No published horses yet</p>
              <p className="mt-2 text-sm text-stone-500">
                This seller has not published any listings yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {seller.horses.map((horse) => (
                <Link
                  key={horse.id}
                  href={`/horses/${horse.id}`}
                  className="block rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Image
                    src={horse.image || "/img/default-horse.png"}
                    alt={horse.name}
                    width={600}
                    height={420}
                    className="h-60 w-full rounded-2xl object-cover"
                  />

                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-stone-900">{horse.name}</h3>
                    <p className="mt-1 text-sm text-stone-500">
                      {horse.breed || "Breed not specified"}
                    </p>

                    <p className="mt-3 font-serif text-2xl text-stone-900">
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
      </section>
    </main>
  );
}