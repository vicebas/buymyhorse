"use client";

import { useState } from "react";

import BarnPlanSelector, { type BillingPlanSelection } from "@/components/billing/barn-plan-selector";

type BillingStatus = "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED";

export default function BillingPlanManager({
  currentPlan,
  currentStatus,
}: {
  currentPlan: BillingPlanSelection;
  currentStatus: BillingStatus;
}) {
  const [selectedPlan, setSelectedPlan] = useState<BillingPlanSelection>(currentPlan);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState("");

  const canReuseCurrentPlan = currentPlan === selectedPlan && currentStatus !== "INCOMPLETE";

  async function handlePlanCheckout() {
    if (canReuseCurrentPlan) {
      return;
    }

    setError("");
    setPlanLoading(true);

    const res = await fetch("/api/billing/activation-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planKey: selectedPlan }),
    });

    const data = await res.json().catch(() => null);
    setPlanLoading(false);

    if (!res.ok || !data?.url) {
      setError(data?.error || "Unable to open plan checkout right now.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="space-y-6">
      <BarnPlanSelector
        selectedPlan={selectedPlan}
        onPlanChange={setSelectedPlan}
        actionLabel={
          planLoading
            ? "Working..."
            : canReuseCurrentPlan
              ? "Current launch plan selected"
              : currentStatus === "INCOMPLETE" && currentPlan === selectedPlan
                ? "Continue checkout"
                : "Switch launch plan"
        }
        onAction={handlePlanCheckout}
        currentPlan={currentPlan}
        disabled={planLoading || canReuseCurrentPlan}
      />

      {error ? (
        <div className="rounded-2xl border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
