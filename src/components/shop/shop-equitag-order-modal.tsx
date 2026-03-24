"use client";

import { useMemo, useState } from "react";
import { Loader2, Minus, Package, Plus, QrCode, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type HorseOption = {
  id: string;
  name: string;
  equiTagId: string | null;
  equiTagCode: string | null;
  hasActiveOrder: boolean;
};

export default function ShopEquiTagOrderModal({
  horses,
  maxBatchQuantity,
}: {
  horses: HorseOption[];
  maxBatchQuantity: number;
}) {
  const [open, setOpen] = useState(false);
  const [selectedHorseId, setSelectedHorseId] = useState(horses[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedHorse = useMemo(
    () => horses.find((horse) => horse.id === selectedHorseId) ?? null,
    [horses, selectedHorseId]
  );

  async function handleOrder() {
    if (!selectedHorse?.equiTagId) {
      setError("Choose a horse with an attached EquiTag.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/equitag/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equiTagId: selectedHorse.equiTagId,
          quantity,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.url) {
        setError(data?.error || "Unable to start the EquiTag order.");
        return;
      }

      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={horses.length === 0}
      >
        Order EquiTags
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Order EquiTags"
            className="w-full max-w-2xl rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6 shadow-[0_32px_80px_rgba(9,28,46,0.36)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
                  EquiTags
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)]">
                  Order physical EquiTags
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--foreground-soft)]">
                  Choose a horse profile, confirm the attached EquiTag, and continue to checkout.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close EquiTag order modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {horses.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)] px-5 py-8 text-center">
                <p className="text-sm text-[color:var(--foreground-soft)]">
                  Add a horse profile first before ordering EquiTags.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground-strong)]">
                    Choose horse
                  </label>
                  <select
                    value={selectedHorseId}
                    onChange={(event) => setSelectedHorseId(event.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-[color:var(--card)] px-4 py-2 text-sm"
                  >
                    {horses.map((horse) => (
                      <option key={horse.id} value={horse.id}>
                        {horse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
                      <QrCode className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[color:var(--foreground-strong)]">
                        {selectedHorse?.name || "Choose a horse"}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                        Attached EquiTag: {selectedHorse?.equiTagCode || "No EquiTag attached yet"}
                      </p>
                      {selectedHorse?.hasActiveOrder ? (
                        <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                          This horse already has an active EquiTag order. You can still place another order.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[color:var(--foreground-strong)]">Quantity</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      disabled={quantity <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--foreground-soft)] hover:bg-[color:var(--muted)] disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-lg font-extrabold text-[color:var(--foreground-strong)]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => Math.min(maxBatchQuantity, current + 1))}
                      disabled={quantity >= maxBatchQuantity}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--foreground-soft)] hover:bg-[color:var(--muted)] disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-[color:var(--foreground-soft)]">
                      Max {maxBatchQuantity} per order
                    </span>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleOrder}
                    disabled={loading || !selectedHorse?.equiTagId}
                    className="btn-brand-green border-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting checkout...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Continue to checkout
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
