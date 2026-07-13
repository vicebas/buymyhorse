"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import BarnPlanSelector, { type BillingPlanSelection } from "@/components/billing/barn-plan-selector";

type BillingStatus = "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED";

export default function PricingPlanExperience({
  hasSession,
  hasBarn,
  currentPlan,
  currentStatus,
  initialPlan = "SINGLE_HORSE",
  trialEnabled = false,
  trialDays = 7,
}: {
  hasSession: boolean;
  hasBarn: boolean;
  currentPlan?: BillingPlanSelection | null;
  currentStatus?: BillingStatus | null;
  initialPlan?: BillingPlanSelection;
  trialEnabled?: boolean;
  trialDays?: number;
}) {
  const router = useRouter();
  const [planKey, setPlanKey] = useState<BillingPlanSelection>(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const alreadyOnSelection = hasBarn && currentPlan === planKey;
  const canSkipCheckout = alreadyOnSelection && currentStatus !== "INCOMPLETE";

  async function handleAction() {
    setError("");

    if (!hasSession) {
      const callbackUrl = `/mybarn/onboard?plan=${planKey}&step=included`;
      router.push(`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (!hasBarn) {
      router.push(`/mybarn/onboard?plan=${planKey}&step=included`);
      return;
    }

    if (canSkipCheckout) {
      router.push("/mybarn/billing");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/billing/activation-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planKey }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok || !data?.url) {
      setError(data?.error || "Unable to start checkout right now.");
      return;
    }

    window.location.href = data.url;
  }

  const actionLabel = !hasSession
    ? "Create account to continue"
    : !hasBarn
      ? "Continue to barn setup"
        : canSkipCheckout
          ? "Open billing dashboard"
          : currentStatus === "INCOMPLETE" && alreadyOnSelection
            ? "Continue checkout"
            : "Continue to plan checkout";

  return (
    <div className="space-y-4">
      <BarnPlanSelector
        selectedPlan={planKey}
        onPlanChange={setPlanKey}
        actionLabel={loading ? "Working..." : actionLabel}
        onAction={handleAction}
        currentPlan={currentPlan ?? null}
        disabled={loading}
        trialEnabled={trialEnabled}
        trialDays={trialDays}
        vaultHref="/mybarn/equivault"
        vaultOnboardingHref={
          hasBarn
            ? null
            : hasSession
              ? `/mybarn/onboard?plan=${planKey}&step=included`
              : `/register?callbackUrl=${encodeURIComponent(`/mybarn/onboard?plan=${planKey}&step=included`)}`
        }
      />

      {error ? (
        <div className="rounded-2xl border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
