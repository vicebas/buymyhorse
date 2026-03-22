import Link from "next/link";

import AdminHorseFeatureToggleForm from "@/components/admin/admin-horse-feature-toggle-form";
import AdminStatusToggleForm from "@/components/admin/admin-status-toggle-form";
import prisma from "@/lib/db/prisma";

export default async function AdminHorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const status =
    params.status === "disabled"
      ? "disabled"
      : params.status === "published"
        ? "published"
        : params.status === "featured"
          ? "featured"
          : "all";

  const horses = await prisma.horse.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sellerProfile: { displayName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(status === "disabled"
        ? { adminDisabledAt: { not: null } }
        : status === "published"
          ? { isPublished: true }
          : status === "featured"
            ? { isPlatformFeatured: true }
          : {}),
    },
    orderBy: [
      { isPlatformFeatured: "desc" },
      { platformFeaturedAt: "desc" },
      { adminDisabledAt: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      name: true,
      isPublished: true,
      isPlatformFeatured: true,
      platformFeaturedAt: true,
      adminDisabledAt: true,
      adminDisableReason: true,
      sellerProfile: {
        select: {
          displayName: true,
          slug: true,
          adminDisabledAt: true,
        },
      },
    },
    take: 75,
  });

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search horses or barns"
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={status}
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          >
            <option value="all">All horses</option>
            <option value="published">Published only</option>
            <option value="featured">Featured only</option>
            <option value="disabled">Disabled only</option>
          </select>
          <button className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)]">
            Filter
          </button>
        </form>
      </div>

      <div className="grid gap-5">
        {horses.map((horse) => (
          <article
            key={horse.id}
            className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]"
          >
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                    {horse.name}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                      horse.adminDisabledAt
                        ? "bg-[color:var(--destructive)]/10 text-[color:var(--destructive)]"
                        : horse.isPublished
                          ? "bg-[rgba(45,84,56,0.14)] text-[#2d5438]"
                          : "bg-[color:var(--muted)] text-[color:var(--foreground-soft)]"
                    }`}
                  >
                    {horse.adminDisabledAt ? "Disabled" : horse.isPublished ? "Published" : "Inactive"}
                  </span>
                  {horse.isPlatformFeatured ? (
                    <span className="rounded-full bg-[rgba(15,42,68,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#0f2a44]">
                      Featured Pick
                    </span>
                  ) : null}
                  {horse.sellerProfile.adminDisabledAt ? (
                    <span className="rounded-full bg-[color:var(--destructive)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--destructive)]">
                      Barn Disabled
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                  Barn: {horse.sellerProfile.displayName}
                </p>
                {horse.isPlatformFeatured ? (
                  <p className="mt-2 text-sm text-[color:var(--foreground)]">
                    Featured at: {horse.platformFeaturedAt ? new Date(horse.platformFeaturedAt).toLocaleString() : "Recently"}
                  </p>
                ) : null}

                {horse.adminDisableReason ? (
                  <p className="mt-4 text-sm text-[color:var(--foreground)]">
                    Admin note: {horse.adminDisableReason}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-4">
                  <Link
                    href={`/horses/${horse.id}`}
                    className="text-sm font-semibold text-[color:var(--foreground-strong)] underline underline-offset-4"
                  >
                    Open horse page
                  </Link>
                  <Link
                    href={`/barn/${horse.sellerProfile.slug}`}
                    className="text-sm font-semibold text-[color:var(--foreground-strong)] underline underline-offset-4"
                  >
                    Open barn page
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <AdminHorseFeatureToggleForm
                  horseId={horse.id}
                  isFeatured={horse.isPlatformFeatured}
                />

                <AdminStatusToggleForm
                  endpoint={`/api/admin/horses/${horse.id}/status`}
                  isDisabled={Boolean(horse.adminDisabledAt)}
                  reason={horse.adminDisableReason}
                  disableLabel="Disable Horse"
                  restoreLabel="Restore Horse"
                />
              </div>
            </div>
          </article>
        ))}

        {horses.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center text-sm text-[color:var(--foreground-soft)]">
            No horses matched the current filters.
          </div>
        ) : null}
      </div>
    </section>
  );
}
