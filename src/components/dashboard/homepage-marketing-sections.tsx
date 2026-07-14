import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  LayoutList,
  Scan,
  User,
  Users,
} from "lucide-react";

export default function HomepageMarketingSections() {
  return (
    <>
      {/* Section 2 — A better way to present horses online */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)] md:text-5xl">
            A better way to present horses online
          </h2>
          <p className="mt-6 text-lg leading-8 text-[color:var(--foreground-soft)]">
            HorseRoster gives every horse a clean, professional profile with the
            photos, video, and details buyers actually want to see.
            Trainers/Barns get a roster page to showcase available horses in one
            place, while buyers get a simpler way to discover, review, and follow
            horses they are interested in.
          </p>
        </div>
      </section>

      {/* Section 3 — Built for modern horse sales */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <p className="mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--foreground-soft)]">
            Built for modern horse sales
          </p>
        </div>

        {/* For buyers / For Trainers-Barns */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-foreground)]">
                <User size={20} />
              </div>
              <h3 className="text-xl font-bold text-[color:var(--foreground-strong)]">
                For Buyers
              </h3>
            </div>
            <p className="mt-4 text-base leading-7 text-[color:var(--foreground-soft)]">
              Browse horses, review media and details, discover more horses from
              the same barn or trainer, and access a more professional buying
              experience from first click to first conversation.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-foreground)]">
                <Users size={20} />
              </div>
              <h3 className="text-xl font-bold text-[color:var(--foreground-strong)]">
                For Trainers/Barns
              </h3>
            </div>
            <p className="mt-4 text-base leading-7 text-[color:var(--foreground-soft)]">
              Create a professional roster, present horses with more clarity,
              manage horse documents in HorseVault, and share each horse through
              the EquiTag system.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
                <LayoutList size={20} />
              </div>
              <h3 className="text-lg font-bold text-[color:var(--foreground-strong)]">
                Professional Horse Profiles
              </h3>
            </div>
            <p className="mt-4 text-base leading-7 text-[color:var(--foreground-soft)]">
              Each horse gets its own dedicated page with media, details, and a
              polished presentation that feels far more credible than scattered
              texts, social posts, and links.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-[color:var(--foreground-strong)]">
                Barn &amp; Trainer Rosters
              </h3>
            </div>
            <p className="mt-4 text-base leading-7 text-[color:var(--foreground-soft)]">
              Every trainer, seller, or barn can showcase their horses together
              in one clean, organized roster.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-bold text-[color:var(--foreground-strong)]">
                HorseVault
              </h3>
            </div>
            <p className="mt-4 text-base leading-7 text-[color:var(--foreground-soft)]">
              Manage horse documents in one professional place and share
              limited-time access to documents with serious buyers when needed.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
                <Scan size={20} />
              </div>
              <h3 className="text-lg font-bold text-[color:var(--foreground-strong)]">
                EquiTag
              </h3>
            </div>
            <p className="mt-4 text-base leading-7 text-[color:var(--foreground-soft)]">
              Each EquiTag is assigned to one horse and opens that horse&apos;s
              profile first. From there, buyers can explore the rest of the barn
              or trainer roster.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — Designed for two sides of the market */}
      <section className="border-y border-[color:var(--border)] bg-[color:var(--background-elevated)]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--foreground-soft)]">
              Two sides of the market
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)] md:text-5xl">
              Designed for two sides of the market
            </h2>
            <p className="mt-6 text-lg leading-8 text-[color:var(--foreground-soft)]">
              HorseRoster is built for both Buyers and Trainers/Barns. Buyers
              get a cleaner, easier way to discover horses, review information,
              and connect with confidence. Trainers/Barns get a more
              professional way to present horses, manage their roster, and share
              each horse more effectively.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 — Why HorseRoster works */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)] md:text-5xl">
            Why HorseRoster works
          </h2>
          <p className="mt-6 text-lg leading-8 text-[color:var(--foreground-soft)]">
            Horse sales are still too fragmented. Buyers chase information
            across text messages, Instagram, WhatsApp, and folders.
            Trainers/Barns constantly resend photos, videos, and documents.
            HorseRoster brings everything into one modern, professional
            experience.
          </p>
        </div>
      </section>

      {/* Sections 6 & 7 — For Buyers / For Trainers-Barns */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-8">
            <h3 className="text-2xl font-bold text-[color:var(--foreground-strong)]">
              For Buyers
            </h3>
            <ul className="mt-6 space-y-4">
              {[
                "Browse available horses",
                "View clean horse profiles",
                "Watch video and review details",
                "Explore barn and trainer rosters",
                "Connect with more confidence",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-base text-[color:var(--foreground-soft)]"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2d5438]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-8">
            <h3 className="text-2xl font-bold text-[color:var(--foreground-strong)]">
              For Trainers/Barns
            </h3>
            <ul className="mt-6 space-y-4">
              {[
                "Create a professional presence",
                "Organize horses in one roster",
                "Manage horse documents in HorseVault",
                "Share horses through EquiTag",
                "Present each horse more clearly and professionally",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-base text-[color:var(--foreground-soft)]"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2d5438]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[color:var(--border)] bg-[color:var(--background-elevated)]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)] md:text-5xl">
              The modern horse marketplace.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[color:var(--foreground-soft)]">
              Built for buyers, Trainers/Barns, and programs who want a more
              professional way to discover, present, and share horses.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/marketplace" className="btn-brand-green">
                Browse Horses
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--background)] px-6 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--muted)]"
              >
                Join HorseRoster
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
