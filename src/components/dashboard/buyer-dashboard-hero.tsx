"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";

export default function BuyerDashboardHero({
  listingCount,
  isLoggedIn,
  isSeller,
  onRequireAuth,
}: {
  listingCount: number;
  isLoggedIn: boolean;
  isSeller: boolean;
  onRequireAuth: () => void;
}) {
  const messageHref = isSeller ? "/mybarn/messages" : "/messages";

  return (
    <section className="border-b border-[color:var(--border)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-6 py-8 text-[color:var(--foreground)] shadow-[var(--shadow-card)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,84,56,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(15,42,68,0.06),transparent_28%)]" />

          <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
                HorseRoster Dashboard
              </p>
              <h1 className="mt-4 text-5xl font-extrabold leading-[0.94] text-[#0f2a44] md:text-6xl">
                Find your next horse in a cleaner, curated roster.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[color:var(--foreground-soft)] md:text-lg">
                Explore professional listings, compare details faster, and move from first look to first conversation without the clutter.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/marketplace"
                      className="btn-brand-green"
                    >
                      Browse Marketplace
                    </Link>
                    <Link
                      href={messageHref}
                      className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--background-elevated)]"
                    >
                      View Messages
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onRequireAuth}
                      className="btn-brand-green"
                    >
                      Browse Marketplace
                    </button>
                    <button
                      type="button"
                      onClick={onRequireAuth}
                      className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-5 py-3 text-sm font-semibold text-[#0f2a44] transition hover:bg-[#f0ebe2]"
                    >
                      View Messages
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--muted)] p-5">
                <p className="mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                  Live Listings
                </p>
                <p className="mt-3 text-4xl font-extrabold text-[#0f2a44]">{listingCount}</p>
                <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                  Hand-picked sport horse presentations ready to review.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--background)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0f2a44]">
                  <Sparkles className="h-4 w-4 text-[#2d5438]" />
                  HorseRoster Standard
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
                  Stronger visuals, cleaner facts, and a card system that makes comparison feel immediate.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-8 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--background)] p-4 text-[color:var(--foreground)] shadow-[var(--shadow-card)] md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3">
                <Search className="h-4 w-4 text-[color:var(--foreground-soft)]" />
                <input
                  placeholder="Search by horse name, discipline, or location..."
                  readOnly={!isLoggedIn}
                  onFocus={!isLoggedIn ? onRequireAuth : undefined}
                  onClick={!isLoggedIn ? onRequireAuth : undefined}
                  className="w-full bg-transparent text-sm text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--foreground)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {["Show Jumping", "Dressage", "Hunters"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full bg-[color:var(--muted)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]"
                  >
                    {tag}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={!isLoggedIn ? onRequireAuth : undefined}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground-strong)] transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
