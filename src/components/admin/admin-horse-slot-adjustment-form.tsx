"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminHorseSlotAdjustmentForm({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const res = await fetch(`/api/admin/billing/${sellerId}/slots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity: Number(quantity),
        note,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Unable to apply the horse slot adjustment.");
      return;
    }

    setQuantity("1");
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
        Horse slot adjustment
      </p>

      <div className="grid gap-3 md:grid-cols-[140px_1fr]">
        <Input
          type="number"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder="+1 or -1"
        />
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Adjustment reason"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Apply Adjustment"}
        </Button>
        {error ? <p className="text-xs text-[color:var(--destructive)]">{error}</p> : null}
      </div>
    </div>
  );
}
