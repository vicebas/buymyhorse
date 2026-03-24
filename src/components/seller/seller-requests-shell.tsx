"use client";

import Link from "next/link";
import { useState } from "react";

import GrantRevokeButton from "@/components/seller/grant-revoke-button";
import RequestActionButtons from "@/components/seller/request-action-buttons";
import { formatDateMDY } from "@/lib/formatting";
import { formatDocumentCategory } from "@/lib/vault/document-categories";

export type SellerVaultRequestItem = {
  id: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "REVOKED";
  createdAt: string;
  intendedUse: string | null;
  message: string | null;
  categories: string[];
  horse: {
    id: string;
    name: string;
  };
  buyer: {
    id: string;
    name: string | null;
    email: string | null;
  };
  availableDocuments: Array<{
    id: string;
    title: string;
    category: string;
  }>;
  grant: {
    id: string;
    status: "ACTIVE" | "EXPIRED" | "REVOKED";
    expiresAt: string | null;
    note: string | null;
    canRevoke: boolean;
  } | null;
};

function getRequestStatusClasses(status: SellerVaultRequestItem["status"]) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REVOKED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "EXPIRED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    default:
      return "border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--foreground-soft)]";
  }
}

function getGrantStatusClasses(status: "ACTIVE" | "EXPIRED" | "REVOKED") {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "EXPIRED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "REVOKED":
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

function getBuyerLabel(buyer: SellerVaultRequestItem["buyer"]) {
  return buyer.name || buyer.email || "Unnamed buyer";
}

export default function SellerRequestsShell({
  requests,
}: {
  requests: SellerVaultRequestItem[];
}) {
  const [buyerFilter, setBuyerFilter] = useState("all");
  const [horseFilter, setHorseFilter] = useState("all");
  const [activeRequestId, setActiveRequestId] = useState(requests[0]?.id ?? null);

  const filteredRequests = requests.filter((request) => {
    const matchesBuyer = buyerFilter === "all" || request.buyer.id === buyerFilter;
    const matchesHorse = horseFilter === "all" || request.horse.id === horseFilter;

    return matchesBuyer && matchesHorse;
  });

  const activeRequest =
    filteredRequests.find((request) => request.id === activeRequestId) ??
    filteredRequests[0] ??
    null;

  const buyerOptions = Array.from(
    new Map(requests.map((request) => [request.buyer.id, request.buyer])).values()
  ).sort((a, b) => getBuyerLabel(a).localeCompare(getBuyerLabel(b)));

  const horseOptions = Array.from(
    new Map(requests.map((request) => [request.horse.id, request.horse])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
        <div className="border-b border-[color:var(--border)] px-5 py-4">
          <p className="text-sm font-semibold text-[color:var(--foreground-strong)]">
            Requests
          </p>
          <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
            Filter by buyer or horse, then open a request to review it on the same screen.
          </p>

          <div className="mt-4 grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                Buyer
              </label>
              <select
                value={buyerFilter}
                onChange={(event) => setBuyerFilter(event.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">All buyers</option>
                {buyerOptions.map((buyer) => (
                  <option key={buyer.id} value={buyer.id}>
                    {getBuyerLabel(buyer)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                Horse
              </label>
              <select
                value={horseFilter}
                onChange={(event) => setHorseFilter(event.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">All horses</option>
                {horseOptions.map((horse) => (
                  <option key={horse.id} value={horse.id}>
                    {horse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3">
          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6 text-center">
              <p className="text-sm font-medium text-[color:var(--foreground-strong)]">
                No matching requests
              </p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                Try a different buyer or horse filter.
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const isActive = request.id === activeRequest?.id;

              return (
                <div
                  key={request.id}
                  onClick={() => setActiveRequestId(request.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveRequestId(request.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`mb-3 rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-[color:var(--accent)] bg-[color:var(--muted)]"
                      : "border-[color:var(--border)] bg-[color:var(--background)] hover:bg-[color:var(--muted)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getRequestStatusClasses(request.status)}`}
                    >
                      {request.status}
                    </span>
                    <span className="text-xs text-[color:var(--foreground-soft)]">
                      {formatDateMDY(request.createdAt)}
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-bold text-[color:var(--foreground-strong)]">
                    {request.horse.name}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                    Buyer: {getBuyerLabel(request.buyer)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {request.categories.slice(0, 2).map((category) => (
                      <span
                        key={`${request.id}-${category}`}
                        className="rounded-full bg-[color:var(--background-elevated)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]"
                      >
                        {formatDocumentCategory(category)}
                      </span>
                    ))}
                    {request.categories.length > 2 ? (
                      <span className="rounded-full bg-[color:var(--background-elevated)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
                        +{request.categories.length - 2}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <section className="min-h-[560px] rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
        {!activeRequest ? (
          <div className="flex h-full items-center justify-center p-10 text-center">
            <div>
              <p className="text-lg font-semibold text-[color:var(--foreground-strong)]">
                No request selected
              </p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                Choose a request from the left to review it here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[560px] flex-col p-6">
            <div className="border-b border-[color:var(--border)] pb-5">
              <div className="flex flex-wrap items-center gap-3">
                <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                  Vault Request
                </p>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getRequestStatusClasses(activeRequest.status)}`}
                >
                  {activeRequest.status}
                </span>
              </div>

              <Link
                href={`/horses/${activeRequest.horse.id}`}
                className="mt-2 inline-flex text-3xl font-extrabold text-[color:var(--foreground-strong)] underline-offset-4 hover:underline"
              >
                {activeRequest.horse.name}
              </Link>

              <p className="mt-3 text-[color:var(--foreground-soft)]">
                Buyer: {getBuyerLabel(activeRequest.buyer)}
              </p>
              {activeRequest.buyer.email ? (
                <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                  {activeRequest.buyer.email}
                </p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                      Requested At
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--foreground)]">
                      {formatDateMDY(activeRequest.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                      Requested Categories
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeRequest.categories.length > 0 ? (
                        activeRequest.categories.map((category) => (
                          <span
                            key={`${activeRequest.id}-${category}`}
                            className="rounded-full bg-[color:var(--card)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]"
                          >
                            {formatDocumentCategory(category)}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-[color:var(--foreground)]">
                          No categories selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                    Intended Use
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--foreground)]">
                    {activeRequest.intendedUse || "No intended use provided"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                    Buyer Message
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--foreground)]">
                    {activeRequest.message || "No message provided"}
                  </p>
                </div>

                {activeRequest.status === "PENDING" ? (
                  <RequestActionButtons
                    requestId={activeRequest.id}
                    availableDocuments={activeRequest.availableDocuments}
                    requestedCategories={activeRequest.categories}
                  />
                ) : null}
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                    Request Context
                  </p>
                  <div className="mt-3 space-y-3 text-sm text-[color:var(--foreground)]">
                    <p>
                      Horse:{" "}
                      <Link
                        href={`/horses/${activeRequest.horse.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {activeRequest.horse.name}
                      </Link>
                    </p>
                    <p>
                      Buyer: <span className="font-medium">{getBuyerLabel(activeRequest.buyer)}</span>
                    </p>
                    <p>
                      Request status: <span className="font-medium">{activeRequest.status}</span>
                    </p>
                  </div>
                </div>

                {activeRequest.grant ? (
                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                        Current Grant
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getGrantStatusClasses(activeRequest.grant.status)}`}
                      >
                        {activeRequest.grant.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-[color:var(--foreground)]">
                      <p>
                        Expires:{" "}
                        <span className="font-medium">
                          {activeRequest.grant.expiresAt
                            ? formatDateMDY(activeRequest.grant.expiresAt)
                            : "No expiration"}
                        </span>
                      </p>
                      <p>
                        Barn note:{" "}
                        <span className="font-medium">
                          {activeRequest.grant.note || "None"}
                        </span>
                      </p>
                    </div>

                    {activeRequest.grant.canRevoke ? (
                      <div className="mt-4">
                        <GrantRevokeButton grantId={activeRequest.grant.id} />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5">
                    <p className="text-sm font-medium text-[color:var(--foreground-strong)]">
                      No active grant
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                      Approve this request to share selected documents with the buyer.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
