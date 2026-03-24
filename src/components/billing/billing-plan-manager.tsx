"use client";

import { useState } from "react";

import BarnPlanSelector, { type BillingCadence } from "@/components/billing/barn-plan-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BillingStatus = "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED";

export default function BillingPlanManager({
  currentCadence,
  currentStatus,
  billingActive,
  purchasedExtraHorseSlots,
  adminAdjustedExtraHorseSlots,
}: {
  currentCadence: BillingCadence;
  currentStatus: BillingStatus;
  billingActive: boolean;
  purchasedExtraHorseSlots: number;
  adminAdjustedExtraHorseSlots: number;
}) {
  const [selectedCadence, setSelectedCadence] = useState<BillingCadence>(currentCadence);
  const [extraQuantity, setExtraQuantity] = useState("1");
  const [activationLoading, setActivationLoading] = useState(false);
  const [extraLoading, setExtraLoading] = useState(false);
  const [error, setError] = useState("");

  const canReuseCurrentActivation = currentCadence === selectedCadence && currentStatus !== "INCOMPLETE";

  async function handleActivationCheckout() {
    if (canReuseCurrentActivation) {
      return;
    }

    setError("");
    setActivationLoading(true);

    const res = await fetch("/api/billing/activation-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cadence: selectedCadence }),
    });

    const data = await res.json().catch(() => null);
    setActivationLoading(false);

    if (!res.ok || !data?.url) {
      setError(data?.error || "Unable to open activation checkout right now.");
      return;
    }

    window.location.href = data.url;
  }

  async function handleExtraCheckout() {
    const quantity = Number(extraQuantity);

    if (!Number.isFinite(quantity) || quantity < 1) {
      setError("Enter a valid quantity for additional horse profiles.");
      return;
    }

    setError("");
    setExtraLoading(true);

    const res = await fetch("/api/billing/extra-horses-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    });

    const data = await res.json().catch(() => null);
    setExtraLoading(false);

    if (!res.ok || !data?.url) {
      setError(data?.error || "Unable to open the additional horse profile checkout right now.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="space-y-6">
      <BarnPlanSelector
        selectedCadence={selectedCadence}
        onCadenceChange={setSelectedCadence}
        actionLabel={
          activationLoading
            ? "Working..."
            : canReuseCurrentActivation
              ? "Current activation cadence selected"
              : currentStatus === "INCOMPLETE" && currentCadence === selectedCadence
                ? "Continue activation checkout"
                : "Update activation cadence"
        }
        onAction={handleActivationCheckout}
        currentCadence={currentCadence}
        disabled={activationLoading || canReuseCurrentActivation}
      />

      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-[color:var(--foreground-strong)]">
              BUY ADDITIONAL HORSE PROFILES
            </h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
              Additional horse profiles are one-time purchases that expand your active public roster whenever your activation is active.
            </p>
          </div>
          <div className="text-sm text-[color:var(--foreground-soft)]">
            Purchased: {purchasedExtraHorseSlots} · Admin adjustments: {adminAdjustedExtraHorseSlots}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            type="number"
            min="1"
            step="1"
            value={extraQuantity}
            onChange={(event) => setExtraQuantity(event.target.value)}
            className="md:w-40"
          />
          <Button
            type="button"
            className="btn-brand-green border-0"
            onClick={handleExtraCheckout}
            disabled={extraLoading || !billingActive}
          >
            {extraLoading ? "Working..." : "Buy additional horse profiles"}
          </Button>
        </div>

        {!billingActive ? (
          <p className="mt-3 text-sm text-[color:var(--destructive)]">
            MyBarn activation must be active before you can buy additional horse profiles.
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
