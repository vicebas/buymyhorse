"use client";

import Link from "next/link";
import { Check, Crown, FolderLock } from "lucide-react";

import EquiVaultGuardModal from "@/components/billing/equivault-guard-modal";
import { Button } from "@/components/ui/button";
import {
  BILLING_PLAN_ORDER,
  BILLING_PLANS,
  type BarnPlanKey,
} from "@/lib/billing/catalog";

export type BillingPlanSelection = BarnPlanKey;

export default function BarnPlanSelector({
  selectedPlan,
  onPlanChange,
  actionLabel,
  onAction,
  currentPlan,
  disabled = false,
  trialEnabled = false,
  trialDays = 7,
  vaultHref = "/mybarn/equivault",
  vaultOnboardingHref,
}: {
  selectedPlan: BillingPlanSelection;
  onPlanChange: (plan: BillingPlanSelection) => void;
  actionLabel: string;
  onAction: () => void;
  currentPlan?: BillingPlanSelection | null;
  disabled?: boolean;
  trialEnabled?: boolean;
  trialDays?: number;
  vaultHref?: string;
  vaultOnboardingHref?: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {BILLING_PLAN_ORDER.map((planKey) => {
            const plan = BILLING_PLANS[planKey];
            const isSelected = selectedPlan === planKey;
            const isCurrent = currentPlan === planKey;

            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => onPlanChange(plan.key)}
                className={`relative rounded-[2rem] border p-6 text-left shadow-[var(--shadow-card)] transition ${
                  isSelected
                    ? "border-[color:var(--accent)] bg-[color:var(--background-elevated)]"
                    : "border-[color:var(--border)] bg-[color:var(--card)]"
                }`}
              >
                {isCurrent ? (
                  <span className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-[rgba(45,84,56,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2d5438]">
                    <Crown className="h-3.5 w-3.5" />
                    Current
                  </span>
                ) : null}

                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
                  {plan.key === "SINGLE_HORSE" ? "Launch special" : "Launch plan"}
                </p>
                <h3 className="mt-3 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
                  {plan.description}
                </p>

                <div className="mt-8 flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-[color:var(--foreground-strong)]">
                    {plan.priceLabel}
                  </span>
                  <span className="pb-1 text-sm text-[color:var(--foreground-soft)]">
                    {plan.intervalLabel}
                  </span>
                </div>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-[color:var(--foreground)]">
                    <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
                    <span>
                      {plan.includedHorseSlots === null
                        ? "Unlimited active horse profiles"
                        : `${plan.includedHorseSlots} active horse profile${plan.includedHorseSlots === 1 ? "" : "s"} included`}
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-[color:var(--foreground)]">
                    <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
                    <span>EquiVault secure document storage and transfer included</span>
                  </li>
                  {trialEnabled ? (
                    <li className="flex items-start gap-3 text-sm text-[color:var(--foreground)]">
                      <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
                      <span>{trialDays}-day launch trial currently available for new barns</span>
                    </li>
                  ) : null}
                </ul>
              </button>
            );
          })}
        </div>

        <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
            Included workspace
          </p>
          <h3 className="mt-3 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            EquiVault
          </h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
            Secure Horse Document Vault
          </p>

          <p className="mt-6 text-sm leading-6 text-[color:var(--foreground-soft)]">
            Store, organize, and securely transfer all of your horse documents in one place.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-[color:var(--foreground)]">
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>Health records, Coggins &amp; PPEs</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>Registrations &amp; contracts</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>Organize documents by horse</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>Securely transfer documents to buyers</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 text-[color:var(--primary)]" />
              <span>Access anywhere</span>
            </li>
          </ul>

          {vaultOnboardingHref ? (
            <EquiVaultGuardModal
              onboardingHref={vaultOnboardingHref}
              triggerClassName="mt-8 w-full"
            />
          ) : (
            <Button asChild variant="outline" className="mt-8 w-full">
              <Link href={vaultHref}>
                <FolderLock className="mr-2 h-4 w-4" />
                Open EquiVault
              </Link>
            </Button>
          )}
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
