import Link from "next/link";

import AdminStatusToggleForm from "@/components/admin/admin-status-toggle-form";
import { getBarnEntitlements } from "@/lib/billing/entitlements";
import prisma from "@/lib/db/prisma";

export default async function AdminBarnsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const status = params.status === "disabled" ? "disabled" : params.status === "active" ? "active" : "all";

  const barns = await prisma.sellerProfile.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { displayName: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status === "disabled"
        ? { adminDisabledAt: { not: null } }
        : status === "active"
          ? { adminDisabledAt: null }
          : {}),
    },
    orderBy: [{ adminDisabledAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      displayName: true,
      slug: true,
      billingCadence: true,
      billingStatus: true,
      adminDisabledAt: true,
      adminDisableReason: true,
    },
    take: 50,
  });

  const entitlementsByBarn = new Map(
    await Promise.all(
      barns.map(async (barn) => [barn.id, await getBarnEntitlements(barn.id)] as const)
    )
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search barns"
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={status}
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          >
            <option value="all">All barns</option>
            <option value="active">Active only</option>
            <option value="disabled">Disabled only</option>
          </select>
          <button className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)]">
            Filter
          </button>
        </form>
      </div>

      <div className="grid gap-5">
        {barns.map((barn) => {
          const entitlements = entitlementsByBarn.get(barn.id);

          return (
            <article
              key={barn.id}
              className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]"
            >
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                      {barn.displayName}
                    </h2>
                    <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                      {barn.billingCadence}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                        barn.adminDisabledAt
                          ? "bg-[color:var(--destructive)]/10 text-[color:var(--destructive)]"
                          : "bg-[rgba(45,84,56,0.14)] text-[#2d5438]"
                      }`}
                    >
                      {barn.adminDisabledAt ? "Disabled" : "Active"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">/barn/{barn.slug}</p>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--foreground-soft)]">
                    <span>Billing: {barn.billingStatus}</span>
                    {entitlements ? <span>Published horses: {entitlements.usage.publishedHorseCount}</span> : null}
                    {entitlements ? <span>Total capacity: {entitlements.activation.totalHorseCapacity}</span> : null}
                    {entitlements ? <span>Extra slots: {entitlements.usage.totalExtraHorseSlots}</span> : null}
                  </div>

                  {barn.adminDisableReason ? (
                    <p className="mt-4 text-sm text-[color:var(--foreground)]">
                      Admin note: {barn.adminDisableReason}
                    </p>
                  ) : null}

                  <div className="mt-5">
                    <Link
                      href={`/barn/${barn.slug}`}
                      className="text-sm font-semibold text-[color:var(--foreground-strong)] underline underline-offset-4"
                    >
                      Open public barn page
                    </Link>
                  </div>
                </div>

                <AdminStatusToggleForm
                  endpoint={`/api/admin/barns/${barn.id}/status`}
                  isDisabled={Boolean(barn.adminDisabledAt)}
                  reason={barn.adminDisableReason}
                  disableLabel="Disable Barn"
                  restoreLabel="Restore Barn"
                />
              </div>
            </article>
          );
        })}

        {barns.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center text-sm text-[color:var(--foreground-soft)]">
            No barns matched the current filters.
          </div>
        ) : null}
      </div>
    </section>
  );
}
