import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import AppHeader from "@/components/layout/app-header";
import HorseMediaGallery from "@/components/horses/horse-media-gallery";
import HorsePrimaryActions from "@/components/horses/horse-primary-actions";
import HorseEquiTagModal from "@/components/equitag/horse-equitag-modal";
import { authOptions } from "@/lib/auth/options";
import { getUserAppHeaderVariant } from "@/lib/auth/get-user-app-header-variant";
import { getBuyerHorseAccess } from "@/lib/vault/access";
import { isHorsePubliclyVisible } from "@/lib/billing/entitlements";

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
      media: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      sellerProfile: true,
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
    access?.status === "ACTIVE"
      ? "ACTIVE"
      : latestRequest?.status || access?.status || "NONE";
  const headerVariant = await getUserAppHeaderVariant(session?.user?.id);
  const keyDetailItems = horse.keyDetails
    ? horse.keyDetails.split("\n").map((item) => item.trim()).filter(Boolean)
    : [];
  const infoItems = [
    { label: "Breed", value: horse.breed || "Not specified" },
    { label: "Age", value: horse.age ? `${horse.age} years` : "Not specified" },
    { label: "Discipline", value: horse.discipline || "Not specified" },
    { label: "Level", value: horse.level || "Not specified" },
    { label: "Height", value: horse.height ? `${horse.height} hh` : "Not specified" },
    { label: "Sex", value: horse.gender || "Not specified" },
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
      <AppHeader variant={headerVariant} />

      <section className="mx-auto max-w-6xl px-6 py-10">
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

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
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
              {horse.breed || "Breed not specified"}
            </p>

            <div className="mt-6">
              <p className="text-3xl font-extrabold text-[color:var(--foreground-strong)]">
                {horse.price
                  ? `$${Number(horse.price).toLocaleString()}`
                  : "Price on request"}
              </p>
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
            </div>

            <div className="mt-6">
              <HorsePrimaryActions
                horseId={horse.id}
                horseName={horse.name}
                sellerName={horse.sellerProfile.displayName}
                isLoggedIn={Boolean(session?.user?.id)}
                currentAccessStatus={currentAccessStatus}
              />
            </div>
          </aside>
        </div>


      </section>
    </main>
  );
}
