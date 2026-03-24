"use client";

import { Check, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";

export type BillingCadence = "MONTHLY" | "YEARLY";

const ACTIVATION_PRICES = {
  MONTHLY: "$19.99",
  YEARLY: "$99.00",
} as const;

export default function BarnPlanSelector({
  selectedCadence,
  onCadenceChange,
  actionLabel,
  onAction,
  currentCadence,
  disabled = false,
  trialEnabled = false,
  trialDays = 7,
}: {
  selectedCadence: BillingCadence;
  onCadenceChange: (cadence: BillingCadence) => void;
  actionLabel: string;
  onAction: () => void;
  currentCadence?: BillingCadence | null;
  disabled?: boolean;
  trialEnabled?: boolean;
  trialDays?: number;
}) {
  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full bg-[color:var(--muted)] p-1">
        {(["MONTHLY", "YEARLY"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onCadenceChange(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedCadence === value
                ? "bg-[color:var(--background-elevated)] text-[color:var(--foreground-strong)] shadow-[var(--shadow-card)]"
                : "text-[color:var(--foreground-soft)]"
            }`}
          >
            {value === "MONTHLY" ? "MONTHLY SUBSCRIPTION" : "ANNUAL SUBSCRIPTION"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="relative rounded-[2rem] border border-[color:var(--accent)] bg-[color:var(--background-elevated)] p-6 shadow-[var(--shadow-card)]">
          <div className="absolute -top-3 left-6 rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-foreground)]">
            MyBarn Created
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                HorseRoster Program Activation
              </h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
                Includes one active public horse profile with its EquiTag. Additional horse profiles can be added later as one-time purchases.
              </p>
            </div>
            {currentCadence === selectedCadence ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(45,84,56,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2d5438]">
                <Crown className="h-3.5 w-3.5" />
                Current
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex items-end gap-2">
            <span className="text-4xl font-extrabold text-[color:var(--foreground-strong)]">
              {ACTIVATION_PRICES[selectedCadence]}
            </span>
            <span className="pb-1 text-sm text-[color:var(--foreground-soft)]">
              {selectedCadence === "MONTHLY" ? "/month" : "/year"}
            </span>
          </div>

          <ul className="mt-6 space-y-3">
            <li className="flex items-start gap-3 text-sm text-[color:var(--foreground)]">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>1 active horse profile included in MyBarn activation</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[color:var(--foreground)]">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>Automatic EquiTag on every horse listing</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[color:var(--foreground)]">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>Buy additional horse profiles later without changing your activation cadence</span>
            </li>
            {trialEnabled ? (
              <li className="flex items-start gap-3 text-sm text-[color:var(--foreground)]">
                <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
                <span>{trialDays}-day MyBarn activation trial currently available for new barns</span>
              </li>
            ) : null}
          </ul>
        </article>

        <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
            Add-on
          </p>
          <h3 className="mt-3 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            Additional Horse Profile
          </h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
            Add more active horses as your roster grows. Each additional horse profile is a one-time purchase tied to your barn account.
          </p>

          <div className="mt-8 flex items-end gap-2">
            <span className="text-4xl font-extrabold text-[color:var(--foreground-strong)]">$14.99</span>
            <span className="pb-1 text-sm text-[color:var(--foreground-soft)]">one-time / horse</span>
          </div>

          <ul className="mt-6 space-y-3 text-sm text-[color:var(--foreground)]">
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>Durable horse-profile entitlement on the barn account</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>Usable whenever your activation is active again</span>
            </li>
          </ul>
        </article>
      </div>

      <div className="flex justify-end">
        <Button type="button" className="btn-brand-green border-0" onClick={onAction} disabled={disabled}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
