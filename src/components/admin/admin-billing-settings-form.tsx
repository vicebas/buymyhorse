"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AdminBillingSettingsForm({
  activationTrialEnabled,
  activationTrialDays,
  singleHorsePriceId,
  barnStarterPriceId,
  barnGrowthPriceId,
  barnUnlimitedPriceId,
  extraHorsePriceId,
  equitagPhysicalPriceId,
  equitagMaxBatchQuantity,
  equitagFulfillmentEmails,
  stripeSecretKeyConfigured,
  stripeWebhookSecretConfigured,
}: {
  activationTrialEnabled: boolean;
  activationTrialDays: number;
  singleHorsePriceId: string;
  barnStarterPriceId: string;
  barnGrowthPriceId: string;
  barnUnlimitedPriceId: string;
  extraHorsePriceId: string;
  equitagPhysicalPriceId: string;
  equitagMaxBatchQuantity: number;
  equitagFulfillmentEmails: string[];
  stripeSecretKeyConfigured: boolean;
  stripeWebhookSecretConfigured: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(activationTrialEnabled);
  const [days, setDays] = useState(String(activationTrialDays));
  const [singleHorsePlanPriceId, setSingleHorsePlanPriceId] = useState(singleHorsePriceId);
  const [starterPlanPriceId, setStarterPlanPriceId] = useState(barnStarterPriceId);
  const [growthPlanPriceId, setGrowthPlanPriceId] = useState(barnGrowthPriceId);
  const [unlimitedPlanPriceId, setUnlimitedPlanPriceId] = useState(barnUnlimitedPriceId);
  const [extraPriceId, setExtraPriceId] = useState(extraHorsePriceId);
  const [eqPhysicalPriceId, setEqPhysicalPriceId] = useState(equitagPhysicalPriceId);
  const [eqMaxBatch, setEqMaxBatch] = useState(String(equitagMaxBatchQuantity));
  const [eqFulfillmentEmails, setEqFulfillmentEmails] = useState(equitagFulfillmentEmails.join("\n"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/billing/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activationTrialEnabled: enabled,
        activationTrialDays: Number(days),
        singleHorsePriceId: singleHorsePlanPriceId.trim(),
        barnStarterPriceId: starterPlanPriceId.trim(),
        barnGrowthPriceId: growthPlanPriceId.trim(),
        barnUnlimitedPriceId: unlimitedPlanPriceId.trim(),
        extraHorsePriceId: extraPriceId.trim(),
        equitagPhysicalPriceId: eqPhysicalPriceId.trim(),
        equitagMaxBatchQuantity: Number(eqMaxBatch),
        equitagFulfillmentEmails: eqFulfillmentEmails,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Unable to save billing settings.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
          Billing settings
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
          Launch pricing and trial control
        </h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
          Stripe secrets stay in env. Admin controls the launch plan Stripe price IDs, add-on pricing, and the onboarding trial behavior here.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
            Stripe secret key
          </p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--foreground-strong)]">
            {stripeSecretKeyConfigured ? "Configured" : "Missing in env"}
          </p>
        </div>
        <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
            Stripe webhook secret
          </p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--foreground-strong)]">
            {stripeWebhookSecretConfigured ? "Configured" : "Missing in env"}
          </p>
        </div>
        <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
            Single Horse price
          </p>
          <p className="mt-2 break-all text-sm text-[color:var(--foreground)]">
            {singleHorsePlanPriceId || "Not configured"}
          </p>
        </div>
        <div className="rounded-2xl bg-[color:var(--background-elevated)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
            Extra horse price
          </p>
          <p className="mt-2 break-all text-sm text-[color:var(--foreground)]">
            {extraPriceId || "Not configured"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
              Stripe price IDs
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
              These IDs are used for launch plan checkout and extra horse purchases. Update them here instead of changing the app code.
            </p>
          </div>

          <div className="grid gap-3">
            <Input
              value={singleHorsePlanPriceId}
              onChange={(event) => setSingleHorsePlanPriceId(event.target.value)}
              placeholder="price_... Single Horse"
            />
            <Input
              value={starterPlanPriceId}
              onChange={(event) => setStarterPlanPriceId(event.target.value)}
              placeholder="price_... Barn Starter"
            />
            <Input
              value={growthPlanPriceId}
              onChange={(event) => setGrowthPlanPriceId(event.target.value)}
              placeholder="price_... Barn Growth"
            />
            <Input
              value={unlimitedPlanPriceId}
              onChange={(event) => setUnlimitedPlanPriceId(event.target.value)}
              placeholder="price_... Barn Unlimited"
            />
            <Input
              value={extraPriceId}
              onChange={(event) => setExtraPriceId(event.target.value)}
              placeholder="price_... extra horse"
            />
            <Input
              value={eqPhysicalPriceId}
              onChange={(event) => setEqPhysicalPriceId(event.target.value)}
              placeholder="price_... physical EquiTag"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
              EquiTag settings
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
              Maximum batch quantity sellers can order at once, plus the fulfillment recipients who should be notified after payment.
            </p>
          </div>

          <div className="max-w-xs space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
              Max batch qty
            </p>
            <Input type="number" min="1" max="100" value={eqMaxBatch} onChange={(event) => setEqMaxBatch(event.target.value)} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
              Fulfillment emails
            </p>
            <Textarea
              value={eqFulfillmentEmails}
              onChange={(event) => setEqFulfillmentEmails(event.target.value)}
              placeholder={"ops@example.com\nshipping@example.com"}
              className="min-h-32"
            />
            <p className="text-xs text-[color:var(--foreground-soft)]">
              One email per line. Matching admin users will receive in-app fulfillment notifications.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">

        <div className="space-y-4 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
              Global trial settings
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
              This applies only to new barn onboardings after you save the setting.
            </p>
          </div>

          <label className="flex items-center gap-3 text-sm text-[color:var(--foreground)]">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-[color:var(--border)]"
            />
            Enable launch trial for new barns
          </label>

          <div className="max-w-xs space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
              Trial days
            </p>
            <Input type="number" min="0" max="90" value={days} onChange={(event) => setDays(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Billing Settings"}
        </Button>
        {error ? <p className="text-xs text-[color:var(--destructive)]">{error}</p> : null}
      </div>
    </div>
  );
}
