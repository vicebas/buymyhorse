"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { QrCode, X, ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";

import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";
import { Button } from "@/components/ui/button";

type HorseEquiTag = {
  id: string;
  code: string;
  svgPath: string;
};

type EquiTagOrderInfo = {
  equiTagId: string;
  status: string;
};

const ORDER_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  PRINTING: { label: "Printing", className: "bg-purple-100 text-purple-800" },
  SHIPPED: { label: "Shipped", className: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
};

export default function HorseEquiTagModal({
  equiTags,
  sellerProfileId,
  maxBatchQuantity = 10,
  activeOrders = [],
}: {
  equiTags: HorseEquiTag[];
  sellerProfileId?: string;
  maxBatchQuantity?: number;
  activeOrders?: EquiTagOrderInfo[];
}) {
  const [open, setOpen] = useState(false);
  const [orderingTagId, setOrderingTagId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  if (equiTags.length === 0) {
    return null;
  }

  function getActiveOrder(tagId: string) {
    return activeOrders.find((o) => o.equiTagId === tagId);
  }

  function getQuantity(tagId: string) {
    return quantities[tagId] ?? 1;
  }

  function setQuantity(tagId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [tagId]: Math.max(1, Math.min(maxBatchQuantity, qty)) }));
  }

  async function handleOrder(tagId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/equitag/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equiTagId: tagId, quantity: getQuantity(tagId) }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open EquiTag codes"
        variant="outline" className="inline-flex items-center gap-2"
      >
        <QrCode className="h-4 w-4" /> <span className="ml-2">Equitag</span>
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="EquiTag codes"
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6 shadow-[0_32px_80px_rgba(9,28,46,0.36)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
                  EquiTag
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)]">
                  Attached EquiTags
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--foreground-soft)]">
                  Scan any attached EquiTag to open this horse profile directly.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close EquiTag modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {equiTags.map((tag) => {
                const activeOrder = getActiveOrder(tag.id);
                const statusInfo = activeOrder ? ORDER_STATUS_LABELS[activeOrder.status] : null;

                return (
                  <div
                    key={tag.id}
                    className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--card)] p-4"
                  >
                    <div className="flex items-center justify-center rounded-[1.25rem] bg-white p-4">
                      <Image
                        src={resolvePublicAssetUrl(tag.svgPath) || "/img/default-horse.png"}
                        alt={`${tag.code} QR code`}
                        width={164}
                        height={164}
                        unoptimized
                        className="h-[164px] w-[164px]"
                      />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="mono text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-strong)]">
                        {tag.code}
                      </span>

                      <Link
                        href={`/eq/${tag.code}`}
                        className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground-strong)]"
                      >
                        Open
                      </Link>
                    </div>

                    {sellerProfileId && (
                      <div className="mt-4 border-t border-[color:var(--border)] pt-4">
                        {activeOrder && statusInfo ? (
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-[color:var(--foreground-soft)]">Physical order</span>
                          </div>
                        ) : orderingTagId === tag.id ? (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-[color:var(--foreground-soft)]">Quantity</p>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setQuantity(tag.id, getQuantity(tag.id) - 1)}
                                disabled={getQuantity(tag.id) <= 1}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--foreground-soft)] hover:bg-[color:var(--muted)] disabled:opacity-40"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-[2rem] text-center text-lg font-extrabold text-[color:var(--foreground-strong)]">
                                {getQuantity(tag.id)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQuantity(tag.id, getQuantity(tag.id) + 1)}
                                disabled={getQuantity(tag.id) >= maxBatchQuantity}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--foreground-soft)] hover:bg-[color:var(--muted)] disabled:opacity-40"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={loading}
                                onClick={() => handleOrder(tag.id)}
                                className="inline-flex items-center gap-2"
                              >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                                Confirm & Pay
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setOrderingTagId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setOrderingTagId(tag.id)}
                            className="inline-flex items-center gap-2"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Order Physical
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
