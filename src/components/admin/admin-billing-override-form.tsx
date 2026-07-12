"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminBillingOverrideForm({
  sellerId,
  currentPlan,
  currentStatus,
  overridePlan,
  overrideStatus,
  overrideReason,
  overrideExpiresAt,
}: {
  sellerId: string;
  currentPlan: "SINGLE_HORSE" | "BARN_STARTER" | "BARN_GROWTH" | "BARN_UNLIMITED";
  currentStatus: "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  overridePlan?: "SINGLE_HORSE" | "BARN_STARTER" | "BARN_GROWTH" | "BARN_UNLIMITED" | null;
  overrideStatus?: "TRIALING" | "ACTIVE" | "INCOMPLETE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | null;
  overrideReason?: string | null;
  overrideExpiresAt?: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(overridePlan || currentPlan);
  const [status, setStatus] = useState(overrideStatus || currentStatus);
  const [reason, setReason] = useState(overrideReason || "");
  const [expiresAt, setExpiresAt] = useState(
    overrideExpiresAt ? overrideExpiresAt.slice(0, 10) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(clear = false) {
    setError("");
    setLoading(true);

    const res = await fetch(`/api/admin/billing/${sellerId}/override`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        clear
          ? {
              clear: true,
              reason,
            }
          : {
              plan,
              status,
              reason,
              expiresAt: expiresAt || null,
            }
      ),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Unable to save billing override.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
        Billing override
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value as typeof plan)}
          className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background)] px-3 py-2 text-sm"
        >
          <option value="SINGLE_HORSE">Single Horse</option>
          <option value="BARN_STARTER">Barn Starter</option>
          <option value="BARN_GROWTH">Barn Growth</option>
          <option value="BARN_UNLIMITED">Barn Unlimited</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background)] px-3 py-2 text-sm"
        >
          <option value="TRIALING">Trialing</option>
          <option value="ACTIVE">Active</option>
          <option value="INCOMPLETE">Incomplete</option>
          <option value="PAST_DUE">Past Due</option>
          <option value="CANCELED">Canceled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Override reason"
        />
        <Input
          type="date"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => handleSave(false)} disabled={loading}>
          {loading ? "Saving..." : "Save Override"}
        </Button>
        <Button type="button" variant="outline" onClick={() => handleSave(true)} disabled={loading}>
          Clear Override
        </Button>
      </div>

      {error ? <p className="text-xs text-[color:var(--destructive)]">{error}</p> : null}
    </div>
  );
}
