"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import type { AppHeaderCTA } from "@/components/layout/app-header";

export default function BuyerDashboardHero({
  listingCount,
  isLoggedIn,
  primaryCta,
  secondaryCta,
  onRequireAuth,
}: {
  listingCount: number;
  isLoggedIn: boolean;
  primaryCta?: AppHeaderCTA | null;
  secondaryCta?: AppHeaderCTA | null;
  onRequireAuth: () => void;
}) {
  return (
    <section className="border-b border-[color:var(--border)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-6 py-8 text-[color:var(--foreground)] shadow-[var(--shadow-card)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,84,56,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(15,42,68,0.06),transparent_28%)]" />

          <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
                HorseRoster
              </p>
              <h1 className="mt-4 text-5xl font-extrabold leading-[0.94] text-[color:var(--foreground-strong)] md:text-6xl">
                Find your next horse.
              </h1>
              <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground-soft)] md:text-3xl">
                The modern horse marketplace.
              </p>
              <p className="mt-5 max-w-xl text-base leading-7 text-[color:var(--foreground-soft)] md:text-lg">
                Browse quality horses, explore barn and trainer rosters, manage horse documents in your EquiVault, and share your horse through the EquiTag system.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {isLoggedIn ? (
                  <>
                    {primaryCta ? (
                      <Link href={primaryCta.action} className="btn-brand-green">
                        {primaryCta.label}
                      </Link>
                    ) : null}
                    {secondaryCta ? (
                      <Link
                        href={secondaryCta.action}
                        className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--background-elevated)]"
                      >
                        {secondaryCta.label}
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onRequireAuth}
                      className="btn-brand-green"
                    >
                      Browse Horses
                    </button>
                    <Link
                      href="/register"
                      className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--muted)]"
                    >
                      Join as a Trainer or Barn
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--muted)] p-5">
                <p className="mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                  Live Listings
                </p>
                <p className="mt-3 text-4xl font-extrabold text-[color:var(--foreground-strong)]">{listingCount}</p>
                <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                  Hand-picked sport horse presentations ready to review.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--background)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground-strong)]">
                  <Sparkles className="h-4 w-4 text-[#2d5438]" />
                  HorseRoster Standard
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
                  Stronger visuals, cleaner facts, and a card system that makes comparison feel immediate.
                </p>
              </div>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}
