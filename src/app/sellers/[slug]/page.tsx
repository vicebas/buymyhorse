import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import PublicBarnContactButton from "@/components/barn/public-barn-contact-button";
import PublicBarnFilters from "@/components/barn/public-barn-filters";
import AppHeader from "@/components/layout/app-header";
import { authOptions } from "@/lib/auth/options";
import { getUserAppHeaderVariant } from "@/lib/auth/get-user-app-header-variant";
import { isBarnPubliclyVisible } from "@/lib/billing/entitlements";
import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";

export default async function PublicSellerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    discipline?: string;
    ageMin?: string;
    ageMax?: string;
    heightMin?: string;
    heightMax?: string;
    location?: string;
    saleStatus?: string;
    sort?: string;
  }>;
}) {
  const { slug } = await params;
  const filters = await searchParams;
  const session = await getServerSession(authOptions);
  const headerVariant = await getUserAppHeaderVariant(session?.user?.id);

  const seller = await prisma.sellerProfile.findFirst({
    where: {
      slug,
      adminDisabledAt: null,
    },
    include: {
      horses: {
        where: {
          isPublished: true,
          deletedAt: null,
          adminDisabledAt: null,
        },
        orderBy: [{ isBarnFeatured: "desc" }, { barnDisplayOrder: "asc" }, { createdAt: "desc" }],
      },
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!seller || !isBarnPubliclyVisible(seller)) {
    notFound();
  }

  const discipline = filters.discipline?.trim() || "";
  const ageMin = parseOptionalNumber(filters.ageMin);
  const ageMax = parseOptionalNumber(filters.ageMax);
  const heightMin = parseOptionalNumber(filters.heightMin);
  const heightMax = parseOptionalNumber(filters.heightMax);
  const location = filters.location?.trim().toLowerCase() || "";
  const saleStatus = filters.saleStatus?.trim() || "";
  const sort = filters.sort === "newest" ? "newest" : "featured-first";

  const featuredHorses = seller.horses.filter((horse) => horse.isBarnFeatured);
  const rosterHorses = [...seller.horses]
    .filter((horse) => {
      if (discipline && horse.discipline !== discipline) {
        return false;
      }

      if (saleStatus && horse.saleStatus !== saleStatus) {
        return false;
      }

      if (location && !horse.location?.toLowerCase().includes(location)) {
        return false;
      }

      if (ageMin !== null && (horse.age === null || horse.age === undefined || horse.age < ageMin)) {
        return false;
      }

      if (ageMax !== null && (horse.age === null || horse.age === undefined || horse.age > ageMax)) {
        return false;
      }

      const parsedHeight = parseHorseHeight(horse.height);

      if (heightMin !== null && (parsedHeight === null || parsedHeight < heightMin)) {
        return false;
      }

      if (heightMax !== null && (parsedHeight === null || parsedHeight > heightMax)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sort === "newest") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }

      if (a.isBarnFeatured !== b.isBarnFeatured) {
        return a.isBarnFeatured ? -1 : 1;
      }

      if (a.barnDisplayOrder !== b.barnDisplayOrder) {
        if (a.barnDisplayOrder === null || a.barnDisplayOrder === undefined) {
          return 1;
        }

        if (b.barnDisplayOrder === null || b.barnDisplayOrder === undefined) {
          return -1;
        }

        return a.barnDisplayOrder - b.barnDisplayOrder;
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const primaryContactHorse = featuredHorses[0] || seller.horses[0] || null;
  const isOwner = session?.user?.id === seller.user.id;
  const hasPublishedHorses = seller.horses.length > 0;
  const hasActiveFilters = Boolean(
    discipline || ageMin !== null || ageMax !== null || heightMin !== null || heightMax !== null || location || saleStatus
  );
  const disciplineOptions = Array.from(
    new Set(
      seller.horses
        .map((horse) => horse.discipline?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <AppHeader variant={headerVariant} />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
          <div className="relative h-[300px] overflow-hidden md:h-[360px]">
            <Image
              src={resolvePublicAssetUrl(seller.coverImage) || resolvePublicAssetUrl(seller.logo) || "/img/default-horse.png"}
              alt={`${seller.displayName} cover`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,28,46,0.18)_0%,rgba(9,28,46,0.82)_100%)]" />
          </div>

          <div className="relative z-10 -mt-20 px-8 pb-8">
            <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:items-end">
              <div className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] shadow-[var(--shadow-card)]">
                <Image
                  src={resolvePublicAssetUrl(seller.logo) || "/img/default-horse.png"}
                  alt={seller.displayName}
                  width={400}
                  height={400}
                  className="h-44 w-full object-cover"
                />
              </div>

              <div className="rounded-[1.75rem] bg-[color:var(--background-elevated)]/92 p-6 backdrop-blur">
                <p className="mono text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                  Barn Frontpage
                </p>

                <h1 className="mt-3 text-5xl font-extrabold text-[color:var(--foreground-strong)]">
                  {seller.displayName}
                </h1>

                {seller.headline ? (
                  <p className="mt-3 text-lg text-[color:var(--foreground-soft)]">{seller.headline}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-[color:var(--foreground-soft)]">
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

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <PublicBarnContactButton
                    isLoggedIn={Boolean(session?.user?.id)}
                    isOwner={isOwner}
                    sellerName={seller.displayName}
                    barnHref={`/barn/${seller.slug}`}
                    primaryHorse={
                      primaryContactHorse
                        ? {
                            id: primaryContactHorse.id,
                            name: primaryContactHorse.name,
                          }
                        : null
                    }
                  />
                  <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                    {seller.horses.length} published {seller.horses.length === 1 ? "listing" : "listings"}
                  </span>
                </div>

                <div className="mt-6 max-w-3xl text-base leading-8 text-[color:var(--foreground)]">
                  {seller.bio ? (
                    <p>{seller.bio}</p>
                  ) : (
                    <p className="text-[color:var(--foreground-soft)]">No barn story available yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {featuredHorses.length > 0 ? (
          <section className="mt-10">
            <div className="mb-6">
              <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                Featured Horses
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[color:var(--foreground-strong)]">
                Curated Frontpage Roster
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredHorses.map((horse) => (
                <Link
                  key={horse.id}
                  href={`/horses/${horse.id}`}
                  className="block rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]"
                >
                  <Image
                    src={resolvePublicAssetUrl(horse.image) || "/img/default-horse.png"}
                    alt={horse.name}
                    width={600}
                    height={420}
                    className="h-60 w-full rounded-2xl object-cover"
                  />

                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-[color:var(--foreground-strong)]">{horse.name}</h3>
                    <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                      {horse.breed || "Breed not specified"}
                    </p>

                    <p className="mt-3 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                      {horse.price
                        ? `$${Number(horse.price).toLocaleString()}`
                        : "Price on request"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <div className="mb-6">
            <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
              Published Horses
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-[color:var(--foreground-strong)]">
              Available Listings
            </h2>
          </div>

          {hasPublishedHorses ? (
            <PublicBarnFilters
              defaultValues={{
                discipline,
                ageMin: filters.ageMin?.trim() || "",
                ageMax: filters.ageMax?.trim() || "",
                heightMin: filters.heightMin?.trim() || "",
                heightMax: filters.heightMax?.trim() || "",
                location: filters.location?.trim() || "",
                saleStatus,
                sort,
              }}
              disciplineOptions={disciplineOptions}
            />
          ) : null}

          {rosterHorses.length === 0 && !hasPublishedHorses ? (
            <div className="mt-6 rounded-3xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-10 text-center shadow-[var(--shadow-card)]">
              <p className="text-lg text-[color:var(--foreground)]">No published horses yet</p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                This barn has not published any listings yet.
              </p>
            </div>
          ) : rosterHorses.length > 0 ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {rosterHorses.map((horse) => (
                <Link
                  key={horse.id}
                  href={`/horses/${horse.id}`}
                  className="block rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]"
                >
                  <Image
                    src={resolvePublicAssetUrl(horse.image) || "/img/default-horse.png"}
                    alt={horse.name}
                    width={600}
                    height={420}
                    className="h-60 w-full rounded-2xl object-cover"
                  />

                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-[color:var(--foreground-strong)]">{horse.name}</h3>
                    <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                      {horse.breed || "Breed not specified"}
                    </p>

                    <p className="mt-3 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                      {horse.price
                        ? `$${Number(horse.price).toLocaleString()}`
                        : "Price on request"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : hasActiveFilters ? (
            <div className="mt-6 rounded-3xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-10 text-center shadow-[var(--shadow-card)]">
              <p className="text-lg text-[color:var(--foreground)]">No horses match these filters</p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                Adjust the roster controls to see more published listings from this barn.
              </p>
            </div>
          ) : null}
        </section>

      </section>
    </main>
  );
}

function parseOptionalNumber(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseHorseHeight(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
