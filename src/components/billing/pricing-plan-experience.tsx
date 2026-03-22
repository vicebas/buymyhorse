"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import BarnPlanSelector, { type BillingCadence } from "@/components/billing/barn-plan-selector";

type BillingStatus = "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED";

export default function PricingPlanExperience({
  hasSession,
  hasBarn,
  currentCadence,
  currentStatus,
  initialCadence = "MONTHLY",
  trialEnabled = false,
  trialDays = 7,
}: {
  hasSession: boolean;
  hasBarn: boolean;
  currentCadence?: BillingCadence | null;
  currentStatus?: BillingStatus | null;
  initialCadence?: BillingCadence;
  trialEnabled?: boolean;
  trialDays?: number;
}) {
  const router = useRouter();
  const [cadence, setCadence] = useState<BillingCadence>(initialCadence);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const alreadyOnSelection = hasBarn && currentCadence === cadence;
  const canSkipCheckout = alreadyOnSelection && currentStatus !== "INCOMPLETE";

  async function handleAction() {
    setError("");

    if (!hasSession) {
      const callbackUrl = `/mybarn/onboard?cadence=${cadence}`;
      router.push(`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (!hasBarn) {
      router.push(`/mybarn/onboard?cadence=${cadence}&step=details`);
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
      body: JSON.stringify({ cadence }),
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
          : "Continue to activation checkout";

  return (
    <div className="space-y-4">
      <BarnPlanSelector
        selectedCadence={cadence}
        onCadenceChange={setCadence}
        actionLabel={loading ? "Working..." : actionLabel}
        onAction={handleAction}
        currentCadence={currentCadence ?? null}
        disabled={loading}
        trialEnabled={trialEnabled}
        trialDays={trialDays}
      />

      {error ? (
        <div className="rounded-2xl border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
