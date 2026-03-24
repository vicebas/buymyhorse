import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import HorseMarketplaceCard from "@/components/horses/horse-marketplace-card";
import { horseListingInclude, mapHorseToCard } from "@/lib/horses/listing-data";

export default async function SavedHorsesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const saved = await prisma.savedHorse.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      horse: {
        include: horseListingInclude,
      },
    },
  });

  // Filter out horses that are no longer visible
  const visibleSaved = saved.filter(
    (s) =>
      s.horse.isPublished &&
      !s.horse.deletedAt &&
      !s.horse.adminDisabledAt &&
      !s.horse.sellerProfile.adminDisabledAt
  );

  const horseCards = visibleSaved.map((s) => mapHorseToCard(s.horse));

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <ResolvedAppHeader variant="buyer" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            My Account
          </p>
          <h1 className="mt-2 text-5xl font-extrabold">Favorites</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
            Horses you&apos;ve favorited from the marketplace.
          </p>
        </div>

        {horseCards.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-12 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-3xl font-extrabold text-[color:var(--foreground-strong)]">
              No favorites yet
            </h2>
            <p className="mt-3 text-sm text-[color:var(--foreground-soft)]">
              Browse the marketplace and tap the heart on any listing to add it here.
            </p>
            <a
              href="/marketplace"
              className="mt-6 inline-flex items-center rounded-2xl bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-foreground)] transition hover:opacity-90"
            >
              Browse Marketplace
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {horseCards.map((horse) => (
              <HorseMarketplaceCard
                key={horse.id}
                horse={horse}
                variant="marketplace"
                isSaved={true}
                isLoggedIn={true}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
