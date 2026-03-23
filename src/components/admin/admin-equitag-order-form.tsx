"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ALL_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PRINTING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export default function AdminEquiTagOrderForm({
  orderId,
  currentStatus,
  deliveryCarrier,
  deliveryTrackingNumber,
  estimatedDeliveryDate,
}: {
  orderId: string;
  currentStatus: string;
  deliveryCarrier: string;
  deliveryTrackingNumber: string;
  estimatedDeliveryDate: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [carrier, setCarrier] = useState(deliveryCarrier);
  const [tracking, setTracking] = useState(deliveryTrackingNumber);
  const [estDelivery, setEstDelivery] = useState(estimatedDeliveryDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setLoading(true);

    const res = await fetch(`/api/admin/equitag-orders/${orderId}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        deliveryCarrier: carrier.trim() || null,
        deliveryTrackingNumber: tracking.trim() || null,
        estimatedDeliveryDate: estDelivery || null,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Failed to update order.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="w-full max-w-xs shrink-0 space-y-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
          Carrier
        </label>
        <Input
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          placeholder="USPS, FedEx, UPS…"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
          Tracking #
        </label>
        <Input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Tracking number"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
          Est. Delivery
        </label>
        <Input
          type="date"
          value={estDelivery}
          onChange={(e) => setEstDelivery(e.target.value)}
        />
      </div>

      <Button type="button" onClick={handleSave} disabled={loading} className="w-full">
        {loading ? "Saving…" : "Update Order"}
      </Button>

      {error && <p className="text-xs text-[color:var(--destructive)]">{error}</p>}
    </div>
  );
}
