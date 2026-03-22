"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bell, Search } from "lucide-react";

import BuyerDashboardHero from "@/components/dashboard/buyer-dashboard-hero";
import DashboardAuthModal from "@/components/dashboard/dashboard-auth-modal";
import HorseMarketplaceCard, { type HorseMarketplaceCardData } from "@/components/horses/horse-marketplace-card";
import HomepageMarketingSections from "@/components/dashboard/homepage-marketing-sections";

export default function DashboardExperience({
  horses,
  featuredHorses,
  followedBarnsHorses,
  isLoggedIn,
  isSeller,
}: {
  horses: HorseMarketplaceCardData[];
  featuredHorses: HorseMarketplaceCardData[];
  followedBarnsHorses: HorseMarketplaceCardData[] | null;
  isLoggedIn: boolean;
  isSeller: boolean;
}) {
  const [authOpen, setAuthOpen] = useState(false);

  function openAuthModal() {
    setAuthOpen(true);
  }

  const totalCount = featuredHorses.length + (followedBarnsHorses ?? horses).length;

  return (
    <>
      <BuyerDashboardHero
        listingCount={totalCount}
        isLoggedIn={isLoggedIn}
        isSeller={isSeller}
        onRequireAuth={openAuthModal}
      />

      {!isLoggedIn && <HomepageMarketingSections />}

      <section className="mx-auto max-w-7xl px-6 py-12">
        {/* Featured horses — admin-curated picks */}
        {featuredHorses.length > 0 ? (
          <div className="mb-8 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)] md:p-8">
            <div className="border-b border-[color:var(--border)] pb-6">
              <p className="mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--foreground-soft)]">
                Featured Horses
              </p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)]">
                Admin-curated platform picks
              </h2>
              <p className="mt-3 max-w-2xl text-base text-[color:var(--foreground-soft)]">
                A tighter edit of standout listings selected for extra marketplace visibility.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredHorses.map((horse) => (
                <HorseMarketplaceCard
                  key={horse.id}
                  horse={horse}
                  isInteractive={isLoggedIn}
                  onRequireAuth={openAuthModal}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Followed barns — shown when user follows at least one barn */}
        {followedBarnsHorses !== null ? (
          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6 shadow-[var(--shadow-card)] md:p-8">
            <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--foreground-soft)]">
                  Barns You Follow
                </p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)]">
                  Latest from followed barns
                </h2>
                <p className="mt-3 max-w-2xl text-base text-[color:var(--foreground-soft)]">
                  Horses from the barns you follow, sorted by most recently updated.
                </p>
              </div>

              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f2a44] transition hover:text-[#2d5438]"
              >
                Browse all listings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {followedBarnsHorses.length === 0 ? (
              <div className="mt-20 flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--foreground-soft)]">
                  <Bell size={28} />
                </div>
                <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                  No horses listed yet
                </h2>
                <p className="max-w-md text-sm leading-6 text-[color:var(--foreground-soft)]">
                  The barns you follow haven&apos;t posted any horses yet. Check back soon, or{" "}
                  <Link href="/marketplace" className="font-semibold text-[#2d5438] hover:underline">
                    browse the marketplace
                  </Link>{" "}
                  to find more barns to follow.
                </p>
              </div>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {followedBarnsHorses.map((horse) => (
                  <HorseMarketplaceCard
                    key={horse.id}
                    horse={horse}
                    isInteractive={isLoggedIn}
                    onRequireAuth={openAuthModal}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Fresh listings — shown to logged-out users and logged-in users without follows */
          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6 shadow-[var(--shadow-card)] md:p-8">
            <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--foreground-soft)]">
                  Current Roster
                </p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)]">
                  Fresh listings from the marketplace
                </h2>
                <p className="mt-3 max-w-2xl text-base text-[color:var(--foreground-soft)]">
                  Built around the HorseRoster listing card system: fast facts, clean pricing, and quicker comparison.
                </p>
              </div>

              {isLoggedIn ? (
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f2a44] transition hover:text-[#2d5438]"
                >
                  Browse all listings
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f2a44] transition hover:text-[#2d5438]"
                >
                  Browse all listings
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {isLoggedIn && (
              <p className="mt-4 text-sm text-[color:var(--foreground-soft)]">
                <Bell className="mr-1.5 inline-block h-3.5 w-3.5 align-text-bottom" />
                Follow barns from their profile pages to see their latest horses here.
              </p>
            )}

            {horses.length === 0 ? (
              <div className="mt-20 flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--foreground-soft)]">
                  <Search size={28} />
                </div>

                <h2 className="text-3xl font-extrabold text-[color:var(--foreground-strong)]">
                  No listings found
                </h2>

                <p className="max-w-md text-sm leading-6 text-[color:var(--foreground-soft)]">
                  No horses have been posted to listings yet.
                </p>
              </div>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {horses.map((horse) => (
                  <HorseMarketplaceCard
                    key={horse.id}
                    horse={horse}
                    isInteractive={isLoggedIn}
                    onRequireAuth={openAuthModal}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <DashboardAuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
