"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json().catch(() => null);
    setLoading(false);

    if (res.ok && data?.url) {
      window.location.href = data.url;
      return;
    }

    setError(data?.error || "Unable to open the billing portal.");
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening portal...
          </>
        ) : (
          "Manage Billing"
        )}
      </Button>

      {error ? <p className="text-xs text-[color:var(--destructive)]">{error}</p> : null}
    </div>
  );
}
