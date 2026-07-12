"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BillingPlanSelection } from "@/components/billing/barn-plan-selector";

export default function StartCheckoutButton({
  planKey,
  label,
  variant = "default",
}: {
  planKey: BillingPlanSelection;
  label: string;
  variant?: "default" | "outline";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
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

    if (res.ok && data?.url) {
      window.location.href = data.url;
      return;
    }

    setError(data?.error || "Unable to start Stripe checkout.");
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant={variant} onClick={handleClick} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          label
        )}
      </Button>

      {error ? <p className="text-xs text-[color:var(--destructive)]">{error}</p> : null}
    </div>
  );
}
