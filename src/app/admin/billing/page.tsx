import AdminBillingOverrideForm from "@/components/admin/admin-billing-override-form";
import AdminBillingSettingsForm from "@/components/admin/admin-billing-settings-form";
import AdminHorseSlotAdjustmentForm from "@/components/admin/admin-horse-slot-adjustment-form";
import { getBarnEntitlements, getEffectiveBarnBillingState } from "@/lib/billing/entitlements";
import { getBillingSettings } from "@/lib/billing/settings";
import prisma from "@/lib/db/prisma";
import { formatDateMDY } from "@/lib/formatting";

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";

  const [settings, barns] = await Promise.all([
    getBillingSettings(),
    prisma.sellerProfile.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { displayName: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        displayName: true,
        slug: true,
        plan: true,
        billingCadence: true,
        billingStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        adminPlanOverride: true,
        adminBillingCadenceOverride: true,
        adminBillingStatusOverride: true,
        adminBillingOverrideReason: true,
        adminBillingOverrideExpiresAt: true,
        trialEndsAt: true,
        currentPeriodEndsAt: true,
      },
      take: 50,
    }),
  ]);

  const entitlementsByBarn = new Map(
    await Promise.all(
      barns.map(async (barn) => [barn.id, await getBarnEntitlements(barn.id)] as const)
    )
  );

  return (
    <section className="space-y-6">
      <AdminBillingSettingsForm
        activationTrialEnabled={settings.activationTrialEnabled}
        activationTrialDays={settings.activationTrialDays}
        activationMonthlyPriceId={settings.activationMonthlyPriceId}
        activationYearlyPriceId={settings.activationYearlyPriceId}
        extraHorsePriceId={settings.extraHorsePriceId}
        equitagPhysicalPriceId={settings.equitagPhysicalPriceId}
        equitagMaxBatchQuantity={settings.equitagMaxBatchQuantity}
        stripeSecretKeyConfigured={settings.stripeSecretKeyConfigured}
        stripeWebhookSecretConfigured={settings.stripeWebhookSecretConfigured}
      />

      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search barns"
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)]">
            Filter
          </button>
        </form>
      </div>

      <div className="grid gap-5">
        {barns.map((barn) => {
          const effective = getEffectiveBarnBillingState(barn);
          const entitlements = entitlementsByBarn.get(barn.id);

          return (
            <article
              key={barn.id}
              className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]"
            >
              <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                      {barn.displayName}
                    </h2>
                    <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">/barn/{barn.slug}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                        Stripe synced
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--foreground)]">
                        {barn.billingCadence} / {barn.billingStatus}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                        Effective app state
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--foreground)]">
                        {effective.effectiveBillingCadence} / {effective.effectiveBillingStatus}
                      </p>
                    </div>
                  </div>

                  {entitlements ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">Published</p>
                        <p className="mt-2 text-lg font-bold text-[color:var(--foreground-strong)]">{entitlements.usage.publishedHorseCount}</p>
                      </div>
                      <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">Purchased extras</p>
                        <p className="mt-2 text-lg font-bold text-[color:var(--foreground-strong)]">{entitlements.usage.purchasedExtraHorseSlots}</p>
                      </div>
                      <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">Admin extras</p>
                        <p className="mt-2 text-lg font-bold text-[color:var(--foreground-strong)]">{entitlements.usage.adminAdjustedExtraHorseSlots}</p>
                      </div>
                      <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">Total capacity</p>
                        <p className="mt-2 text-lg font-bold text-[color:var(--foreground-strong)]">{entitlements.activation.totalHorseCapacity}</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2 text-sm text-[color:var(--foreground-soft)]">
                    <p>Stripe customer: {barn.stripeCustomerId || "None"}</p>
                    <p>Stripe subscription: {barn.stripeSubscriptionId || "None"}</p>
                    {effective.overrideActive ? (
                      <p>
                        Override active{effective.overrideExpiresAt ? ` until ${formatDateMDY(effective.overrideExpiresAt)}` : ""}.
                      </p>
                    ) : null}
                    {effective.overrideReason ? <p>Override note: {effective.overrideReason}</p> : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <AdminBillingOverrideForm
                    sellerId={barn.id}
                    currentCadence={barn.billingCadence}
                    currentStatus={barn.billingStatus}
                    overrideCadence={barn.adminBillingCadenceOverride}
                    overrideStatus={barn.adminBillingStatusOverride}
                    overrideReason={barn.adminBillingOverrideReason}
                    overrideExpiresAt={barn.adminBillingOverrideExpiresAt?.toISOString() || null}
                  />

                  <AdminHorseSlotAdjustmentForm sellerId={barn.id} />
                </div>
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
