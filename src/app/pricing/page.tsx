import { CheckCircle2, CreditCard, Sparkles } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import PricingPlanExperience from "@/components/billing/pricing-plan-experience";
import MainHeader from "@/components/layout/main-header";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { isAdminRole } from "@/lib/admin/roles";
import { getBillingSettings } from "@/lib/billing/settings";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  const billingSettings = await getBillingSettings();

  let userState: {
    hasSession: boolean;
    hasBarn: boolean;
    currentPlan: "SINGLE_HORSE" | "BARN_STARTER" | "BARN_GROWTH" | "BARN_UNLIMITED" | null;
    currentStatus: "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | null;
  } = {
    hasSession: false,
    hasBarn: false,
    currentPlan: null,
    currentStatus: null,
  };

  if (session?.user?.id) {
    const [user, sellerProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      }),
      prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          plan: true,
          billingStatus: true,
        },
      }),
    ]);

    if (isAdminRole(user?.role)) {
      redirect("/admin");
    }

    userState = {
      hasSession: true,
      hasBarn: Boolean(sellerProfile),
      currentPlan: sellerProfile?.plan ?? null,
      currentStatus: sellerProfile?.billingStatus ?? null,
    };
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <MainHeader activeItem="pricing" />

      <section className="border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
              <Sparkles className="h-3.5 w-3.5" />
              Barn billing
            </div>

            <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-[color:var(--foreground-strong)] md:text-6xl">
              Promotional launch pricing for every barn size
            </h1>

            <p className="mt-5 text-lg leading-8 text-[color:var(--foreground-soft)]">
              Choose the launch plan that fits your active horse count. Every paid plan includes Horse Profiles, My Barn, HorseVault, and EquiTag from day one.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <PricingPlanExperience
          hasSession={userState.hasSession}
          hasBarn={userState.hasBarn}
          currentPlan={userState.currentPlan}
          currentStatus={userState.currentStatus}
          trialEnabled={billingSettings.activationTrialEnabled}
          trialDays={billingSettings.activationTrialDays}
        />
      </section>

      <section className="border-t border-[color:var(--border)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-14 md:grid-cols-3">
          <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3 text-[color:var(--foreground-strong)]">
              <CheckCircle2 className="h-5 w-5 text-[color:var(--primary)]" />
              Plans sized for real rosters
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
              Launch plans cover 1, 5, 20, or unlimited active horse listings while drafts stay in your barn without consuming public capacity.
            </p>
          </article>

          <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3 text-[color:var(--foreground-strong)]">
              <CheckCircle2 className="h-5 w-5 text-[color:var(--primary)]" />
              HorseVault included
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
              Secure document storage, organization, and buyer-ready transfer are built into every paid HorseRoster plan.
            </p>
          </article>

          <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3 text-[color:var(--foreground-strong)]">
              <CreditCard className="h-5 w-5 text-[color:var(--primary)]" />
              Flexible billing
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
              Start on any launch plan, then manage payment methods, invoices, future plan changes, and extra profile purchases through the Stripe billing portal.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
