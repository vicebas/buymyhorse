"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function EquiTagOrderActions({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"pay" | "cancel" | null>(null);
  const [error, setError] = useState("");

  async function handleRetryPayment() {
    setError("");
    setLoadingAction("pay");

    const response = await fetch(`/api/equitag/orders/${orderId}/retry-payment`, {
      method: "POST",
    });
    const data = await response.json().catch(() => null);
    setLoadingAction(null);

    if (!response.ok || !data?.url) {
      setError(data?.error || "Unable to restart checkout.");
      return;
    }

    window.location.href = data.url;
  }

  async function handleCancelOrder() {
    setError("");
    setLoadingAction("cancel");

    const response = await fetch(`/api/equitag/orders/${orderId}/cancel`, {
      method: "POST",
    });
    const data = await response.json().catch(() => null);
    setLoadingAction(null);

    if (!response.ok) {
      setError(data?.error || "Unable to cancel the order.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button type="button" onClick={handleRetryPayment} disabled={loadingAction !== null}>
        {loadingAction === "pay" ? "Opening checkout..." : "Pay Now"}
      </Button>
      <Button type="button" variant="outline" onClick={handleCancelOrder} disabled={loadingAction !== null}>
        {loadingAction === "cancel" ? "Cancelling..." : "Cancel Order"}
      </Button>
      {error ? <p className="w-full text-sm text-[color:var(--destructive)]">{error}</p> : null}
    </div>
  );
}
