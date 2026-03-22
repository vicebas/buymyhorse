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
    currentCadence: "MONTHLY" | "YEARLY" | null;
    currentStatus: "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | null;
  } = {
    hasSession: false,
    hasBarn: false,
    currentCadence: null,
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
          billingCadence: true,
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
      currentCadence: sellerProfile?.billingCadence ?? null,
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
              One activation, then add horses as you grow
            </h1>

            <p className="mt-5 text-lg leading-8 text-[color:var(--foreground-soft)]">
              HorseRoster activation includes one active horse. Buy extra horse profiles when your sales roster needs more public capacity.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <PricingPlanExperience
          hasSession={userState.hasSession}
          hasBarn={userState.hasBarn}
          currentCadence={userState.currentCadence}
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
              1 included active horse
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
              Activation covers one active public horse listing. Draft horses can stay in your barn without consuming public capacity.
            </p>
          </article>

          <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3 text-[color:var(--foreground-strong)]">
              <CheckCircle2 className="h-5 w-5 text-[color:var(--primary)]" />
              Extra horse add-on
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
              Additional horse profiles are one-time purchases for $14.99 each and become available again whenever your activation is active.
            </p>
          </article>

          <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3 text-[color:var(--foreground-strong)]">
              <CreditCard className="h-5 w-5 text-[color:var(--primary)]" />
              Stripe billing
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
              Choose monthly or yearly activation, then manage renewal settings and invoices through the Stripe billing portal.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
