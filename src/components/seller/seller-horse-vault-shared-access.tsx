"use client";

import { useMemo, useState } from "react";

import GrantExpirationButton from "@/components/seller/grant-expiration-button";
import GrantRevokeButton from "@/components/seller/grant-revoke-button";
import { formatDocumentCategory } from "@/lib/vault/document-categories";
import type { SellerHorseVaultSharedAccessItem } from "@/lib/vault/shared-access";

function formatDateTime(value: string | null) {
  if (!value) {
    return "No expiration";
  }

  return new Date(value).toLocaleString();
}

function getOriginClasses(origin: SellerHorseVaultSharedAccessItem["origin"]) {
  switch (origin) {
    case "DIRECT_SHARE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "APPROVED_REQUEST":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[color:var(--foreground-soft)]";
  }
}

function getStatusClasses(status: SellerHorseVaultSharedAccessItem["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-[rgba(45,84,56,0.14)] text-[color:var(--foreground-strong)]";
    case "EXPIRED":
      return "bg-amber-100 text-amber-800";
    case "REVOKED":
      return "bg-rose-100 text-rose-800";
  }
}

export default function SellerHorseVaultSharedAccess({
  items,
}: {
  items: SellerHorseVaultSharedAccessItem[];
}) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | SellerHorseVaultSharedAccessItem["status"]>("ALL");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(items.flatMap((item) => item.documents.map((document) => document.category)))
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }

      if (recipientQuery.trim()) {
        const haystack = `${item.buyer.label} ${item.buyer.email || ""}`.toLowerCase();
        if (!haystack.includes(recipientQuery.trim().toLowerCase())) {
          return false;
        }
      }

      if (categoryFilter !== "ALL" && !item.documents.some((document) => document.category === categoryFilter)) {
        return false;
      }

      return true;
    });
  }, [categoryFilter, items, recipientQuery, statusFilter]);

  const groupedItems = useMemo(
    () => ({
      ACTIVE: filteredItems.filter((item) => item.status === "ACTIVE"),
      EXPIRED: filteredItems.filter((item) => item.status === "EXPIRED"),
      REVOKED: filteredItems.filter((item) => item.status === "REVOKED"),
    }),
    [filteredItems]
  );

  if (items.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[color:var(--border)] bg-[color:var(--muted)]/50 p-8 text-center">
        <p className="text-lg font-semibold text-[color:var(--foreground-strong)]">
          No shared access yet
        </p>
        <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
          Buyers who receive access to this horse&apos;s private documents will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--card)] p-4 md:grid-cols-[1fr_220px_220px]">
        <input
          type="text"
          value={recipientQuery}
          onChange={(event) => setRecipientQuery(event.target.value)}
          placeholder="Filter by recipient"
          className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
        >
          <option value="ALL">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {formatDocumentCategory(category)}
            </option>
          ))}
        </select>
      </div>

      {(["ACTIVE", "EXPIRED", "REVOKED"] as const).map((status) => (
        <section key={status} className="space-y-4">
          <div>
            <p className="mono text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
              Shared Access
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </h3>
          </div>

          {groupedItems[status].length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--border)] bg-[color:var(--muted)]/50 p-6 text-sm text-[color:var(--foreground-soft)]">
              No {status.toLowerCase()} access records match the current filters.
            </div>
          ) : (
            groupedItems[status].map((item) => (
              <div
                key={item.grantId}
                className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--muted)]/45 p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[color:var(--foreground-strong)]">
                        {item.buyer.label}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(item.status)}`}>
                        {item.status}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getOriginClasses(item.origin)}`}
                      >
                        {item.originLabel}
                      </span>
                    </div>

                    {item.buyer.email ? (
                      <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                        {item.buyer.email}
                      </p>
                    ) : null}

                    <div className="mt-4 grid gap-3 text-sm text-[color:var(--foreground)] md:grid-cols-2">
                      <p>
                        Last shared: <span className="font-medium">{formatDateTime(item.sharedAt)}</span>
                      </p>
                      <p>
                        Expires: <span className="font-medium">{formatDateTime(item.expiresAt)}</span>
                      </p>
                      <p>
                        Current files: <span className="font-medium">{item.documents.length}</span>
                      </p>
                    </div>

                    {item.note ? (
                      <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-sm text-[color:var(--foreground)]">
                        Barn note: {item.note}
                      </div>
                    ) : null}

                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                        Shared documents
                      </p>
                      {item.documents.length === 0 ? (
                        <div className="mt-3 rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-4 text-sm text-[color:var(--foreground-soft)]">
                          No currently shared files remain on this grant.
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.documents.map((document) => (
                            <span
                              key={document.id}
                              className="rounded-full bg-[color:var(--background-elevated)] px-3 py-1 text-xs font-medium text-[color:var(--foreground-soft)]"
                            >
                              {document.title}
                              <span className="ml-2 uppercase tracking-[0.12em]">
                                {formatDocumentCategory(document.category)}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full space-y-3 xl:w-auto xl:min-w-56">
                    <GrantExpirationButton
                      grantId={item.grantId}
                      initialExpiresAt={item.expiresAt}
                      disabled={item.status === "REVOKED"}
                    />
                    {item.status === "ACTIVE" ? <GrantRevokeButton grantId={item.grantId} /> : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      ))}
    </div>
  );
}
