import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import HorseMediaGallery from "@/components/horses/horse-media-gallery";
import HorsePrimaryActions from "@/components/horses/horse-primary-actions";
import HorseEquiTagModal from "@/components/equitag/horse-equitag-modal";
import SaveHorseButton from "@/components/horses/save-horse-button";
import { authOptions } from "@/lib/auth/options";
import { getUserAppHeaderVariant } from "@/lib/auth/get-user-app-header-variant";
import { getBuyerHorseAccess } from "@/lib/vault/access";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";
import {
  getHorseBestSuitedForLabel,
  getHorseBreedLabel,
  getHorsePrimaryDisciplineLabel,
  getHorsePricingVisibilityLabel,
  getHorseSexLabel,
  horseListingInclude,
} from "@/lib/horses/listing-data";

export default async function HorsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const horse = await prisma.horse.findUnique({
    where: { id },
    include: {
      ...horseListingInclude,
      media: {
        where: {
          status: "READY",
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      attachedEquiTags: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          code: true,
          svgPath: true,
        },
      },
    },
  });

  if (!horse || !isHorsePubliclyVisible(horse)) {
    notFound();
  }

  await prisma.horseFeatureMetrics.upsert({
    where: { horseId: horse.id },
    update: {
      profileViews: {
        increment: 1,
      },
      lastProfileViewAt: new Date(),
    },
    create: {
      horseId: horse.id,
      profileViews: 1,
      lastProfileViewAt: new Date(),
    },
  });

  const access = session?.user?.id
    ? await getBuyerHorseAccess(session.user.id, horse.id)
    : null;

  const latestRequest = session?.user?.id
    ? await prisma.accessRequest.findFirst({
        where: {
          horseId: horse.id,
          buyerId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          status: true,
        },
      })
    : null;

  const currentAccessStatus =
    access?.status && access.status !== "NONE"
      ? access.status
      : latestRequest?.status || "NONE";

  const isSaved = session?.user?.id
    ? Boolean(
        await prisma.savedHorse.findUnique({
          where: { userId_horseId: { userId: session.user.id, horseId: horse.id } },
          select: { id: true },
        })
      )
    : false;
  const headerVariant = await getUserAppHeaderVariant(session?.user?.id);
  const keyDetailItems = horse.keyDetails
    ? horse.keyDetails.split("\n").map((item) => item.trim()).filter(Boolean)
    : [];
  const infoItems = [
    { label: "Breed", value: getHorseBreedLabel(horse) || "Not specified" },
    { label: "Age", value: horse.age ? `${horse.age} years` : "Not specified" },
    { label: "Discipline", value: getHorsePrimaryDisciplineLabel(horse) || "Not specified" },
    { label: "Best Suited For", value: getHorseBestSuitedForLabel(horse) || "Not specified" },
    { label: "Height", value: horse.height ? `${horse.height} hh` : "Not specified" },
    { label: "Sex", value: getHorseSexLabel(horse) || "Not specified" },
    { label: "Pricing", value: getHorsePricingVisibilityLabel(horse) },
    { label: "Location", value: horse.location || "Not specified" },
    {
      label: "Status",
      value: horse.saleStatus
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    },
  ];
  const totalPhotoCount =
    (horse.image ? 1 : 0) + horse.media.filter((item) => item.type === "IMAGE").length;
  const totalVideoCount = horse.media.filter((item) => item.type === "VIDEO").length;

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <ResolvedAppHeader variant={headerVariant} />

      <section className="mx-auto max-w-6xl px-6 py-10 pb-28 sm:pb-32 lg:pb-10">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.9fr] lg:items-start">
          <div>
            <HorseMediaGallery
              horseName={horse.name}
              primaryImage={horse.image}
              media={horse.media.map((item) => ({
                id: item.id,
                type: item.type,
                processedPath: item.processedPath,
                posterPath: item.posterPath,
                fileName: item.fileName,
              }))}
            />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr]">
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">About this horse</h2>

            <div className="mt-5 text-base leading-8 text-[color:var(--foreground)]">
              {horse.description ? (
                <p>{horse.description}</p>
              ) : (
                <p className="text-[color:var(--foreground-soft)]">No description provided yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-[var(--shadow-card)]">
            <p className="mono text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
              Media Overview
            </p>
            <h2 className="mt-3 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
              Rich Listing Assets
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-3" >
              <div className="rounded-2xl bg-[color:var(--muted)] p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                  Photos
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                  {totalPhotoCount}
                </p>
              </div>
              <div className="rounded-2xl bg-[color:var(--muted)] p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                  Videos
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                  {totalVideoCount}
                </p>
              </div>
              <div className="rounded-2xl bg-[color:var(--muted)] p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                  Barn
                </p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground-strong)]">
                  {horse.sellerProfile.displayName}
                </p>
                <a href={`/barn/${horse.sellerProfile.slug}`} className="btn btn-primary mt-2 text-sm font-semibold text-[color:var(--foreground-strong)] underline">
                  View Barn
                </a>
              </div>
            </div>
          </div>
        </div>
          </div>

          <aside className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-[var(--shadow-card)]">
            <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
              Horse Listing
            </p>

            <div className="mt-3 flex items-center gap-3">
              <h1 className="text-4xl font-extrabold text-[color:var(--foreground-strong)]">
                {horse.name}
              </h1>
              <HorseEquiTagModal equiTags={horse.attachedEquiTags} />
            </div>

            <p className="mt-2 text-lg text-[color:var(--foreground-soft)]">
              {getHorseBreedLabel(horse) || "Breed not specified"}
            </p>

            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                Pricing visibility
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--foreground-strong)]">
                {getHorsePricingVisibilityLabel(horse)}
              </p>
            </div>

            <div className="mt-4">
              <SaveHorseButton
                horseId={horse.id}
                initialSaved={isSaved}
                isLoggedIn={Boolean(session?.user?.id)}
                size="detail"
              />
            </div>

            <div className="mt-8 rounded-2xl bg-[color:var(--muted)] p-5">
              <p className="mono text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                Key Info
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {infoItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--foreground-strong)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {keyDetailItems.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {keyDetailItems.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[color:var(--background-elevated)] px-3 py-1.5 text-sm font-medium text-[color:var(--foreground-strong)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5">
              <p className="text-sm text-[color:var(--foreground-soft)]">Barn</p>
              <p className="mt-1 text-base font-medium text-[color:var(--foreground-strong)]">
                {horse.sellerProfile.displayName}
              </p>
              <a href={`/barn/${horse.sellerProfile.slug}`} className=" mt-1 text-sm font-medium text-[color:var(--foreground-strong)] underline">
                View Barn
              </a>
            </div>

            <div className="mt-6 hidden lg:block">
              <HorsePrimaryActions
                horseId={horse.id}
                horseName={horse.name}
                sellerName={horse.sellerProfile.displayName}
                isLoggedIn={Boolean(session?.user?.id)}
                emailVerified={Boolean(session?.user?.emailVerified)}
                currentAccessStatus={currentAccessStatus}
                accessHref={access?.grant?.id ? `/access/grants/${access.grant.id}` : undefined}
                layout="inline"
              />
            </div>

          </aside>
        </div>
      </section>

      <HorsePrimaryActions
        horseId={horse.id}
        horseName={horse.name}
        sellerName={horse.sellerProfile.displayName}
        isLoggedIn={Boolean(session?.user?.id)}
        emailVerified={Boolean(session?.user?.emailVerified)}
        currentAccessStatus={currentAccessStatus}
        accessHref={access?.grant?.id ? `/access/grants/${access.grant.id}` : undefined}
        layout="floating"
      />
    </main>
  );
}
