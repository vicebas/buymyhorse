import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AlertTriangle, CreditCard, Rocket, Repeat, ShoppingBag } from "lucide-react";

import BillingPlanManager from "@/components/billing/billing-plan-manager";
import ManageBillingButton from "@/components/billing/manage-billing-button";
import SellerAppHeader from "@/components/layout/seller-app-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { getBarnEntitlements } from "@/lib/billing/entitlements";
import prisma from "@/lib/db/prisma";
import { formatDateMDY } from "@/lib/formatting";

function formatBillingStatus(status: string) {
  switch (status) {
    case "TRIALING":
      return "Trialing";
    case "ACTIVE":
      return "Active";
    case "INCOMPLETE":
      return "Checkout incomplete";
    case "PAST_DUE":
      return "Past due";
    case "CANCELED":
      return "Canceled";
    case "EXPIRED":
      return "Expired";
    default:
      return status;
  }
}

export default async function SellerBillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/mybarn/billing");
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      displayName: true,
      plan: true,
      billingCadence: true,
      billingStatus: true,
      adminPlanOverride: true,
      adminBillingCadenceOverride: true,
      adminBillingStatusOverride: true,
      adminBillingOverrideReason: true,
      adminBillingOverrideExpiresAt: true,
      stripeCustomerId: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
    },
  });

  if (!seller) {
    redirect("/mybarn/onboard");
  }

  const entitlements = await getBarnEntitlements(seller.id);
  const effectiveBilling = entitlements.effective;
  const showWarning = !entitlements.billingActive || !entitlements.canPublishMoreHorses;

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <SellerAppHeader />

      <section className="border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            Barn billing
          </p>
          <h1 className="mt-3 text-5xl font-extrabold text-[color:var(--foreground-strong)]">
            MyBarn Activation
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-[color:var(--foreground-soft)]">
            Manage your activation cadence, buy additional horse profiles, and see exactly how much public roster capacity your barn has right now.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {showWarning ? (
          <div className="rounded-[2rem] border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 p-5 text-[color:var(--destructive)] shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold">
                  {!entitlements.billingActive
                    ? "Your activation is not currently active."
                    : "You have used all currently available horse profiles."}
                </p>
                <p className="text-sm opacity-90">
                  Draft horses stay in your barn, but public horse visibility depends on active billing and available horse-profile capacity.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
              <Rocket className="h-4 w-4" />
              Activation
            </div>
            <p className="mt-4 text-3xl font-extrabold text-[color:var(--foreground-strong)]">HorseRoster</p>
            <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
              {effectiveBilling.effectiveBillingCadence === "MONTHLY" ? "MONTHLY SUBSCRIPTION" : "ANNUAL SUBSCRIPTION"}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
              <CreditCard className="h-4 w-4" />
              Billing status
            </div>
            <p className="mt-4 text-3xl font-extrabold text-[color:var(--foreground-strong)]">
              {formatBillingStatus(effectiveBilling.effectiveBillingStatus)}
            </p>
            <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
              {seller.trialEndsAt
                ? `Trial ends ${formatDateMDY(seller.trialEndsAt)}`
                : seller.currentPeriodEndsAt
                  ? `Renews ${formatDateMDY(seller.currentPeriodEndsAt)}`
                  : "Waiting for Stripe sync"}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
              <ShoppingBag className="h-4 w-4" />
              Published horse profiles
            </div>
            <p className="mt-4 text-3xl font-extrabold text-[color:var(--foreground-strong)]">
              {entitlements.usage.publishedHorseCount}/{entitlements.activation.totalHorseCapacity}
            </p>
            <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
              Base included profile: {entitlements.activation.includedHorseSlots}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-sm text-[color:var(--foreground-soft)]">
              <Repeat className="h-4 w-4" />
              Additional profiles
            </div>
            <p className="mt-4 text-3xl font-extrabold text-[color:var(--foreground-strong)]">
              {entitlements.usage.totalExtraHorseSlots}
            </p>
            <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
              Purchased {entitlements.usage.purchasedExtraHorseSlots} · Admin {entitlements.usage.adminAdjustedExtraHorseSlots}
            </p>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
              MyBarn Activation
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
              Switch between monthly and annual activation, then buy one-time additional horse profiles whenever you need more public roster capacity.
            </p>

            <div className="mt-6">
              <BillingPlanManager
                currentCadence={effectiveBilling.effectiveBillingCadence as "MONTHLY" | "YEARLY"}
                currentStatus={effectiveBilling.effectiveBillingStatus as "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED"}
                billingActive={entitlements.billingActive}
                purchasedExtraHorseSlots={entitlements.usage.purchasedExtraHorseSlots}
                adminAdjustedExtraHorseSlots={entitlements.usage.adminAdjustedExtraHorseSlots}
              />
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-extrabold text-[color:var(--foreground-strong)]">
                Effective billing state
              </h2>
              <div className="mt-4 space-y-2 text-sm text-[color:var(--foreground-soft)]">
                <p>
                  Stripe synced: {seller.billingCadence} / {seller.billingStatus}
                </p>
                <p>
                    Effective: {effectiveBilling.effectiveBillingCadence} / {effectiveBilling.effectiveBillingStatus}
                </p>
                {effectiveBilling.overrideActive ? (
                  <p>
                    Admin override active{effectiveBilling.overrideExpiresAt ? ` until ${formatDateMDY(effectiveBilling.overrideExpiresAt)}` : ""}.
                  </p>
                ) : null}
                {effectiveBilling.overrideReason ? <p>Admin note: {effectiveBilling.overrideReason}</p> : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-extrabold text-[color:var(--foreground-strong)]">
                Billing tools
              </h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
                Open the Stripe portal to update payment methods, invoices, and renewal settings.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {seller.stripeCustomerId ? <ManageBillingButton /> : null}
                <Link href="/pricing">
                  <Button variant="outline">View activation pricing</Button>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-extrabold text-[color:var(--foreground-strong)]">
                Activation rules
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
                <li>A horse must include required listing details and a main image before it can be published.</li>
                <li>Base activation includes one active horse profile; additional horse profiles are additive.</li>
                <li>If activation is inactive, public horse pages, marketplace listings, and barn roster exposure are hidden until billing is active again.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
