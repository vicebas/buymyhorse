import GrantRevokeButton from "@/components/seller/grant-revoke-button";
import { formatDocumentCategory } from "@/lib/vault/document-categories";
import type { SellerHorseVaultSharedAccessItem } from "@/lib/vault/shared-access";

function formatDateTime(value: string) {
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

export default function SellerHorseVaultSharedAccess({
  items,
}: {
  items: SellerHorseVaultSharedAccessItem[];
}) {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[color:var(--border)] bg-[color:var(--muted)]/50 p-8 text-center">
          <p className="text-lg font-semibold text-[color:var(--foreground-strong)]">
            No active shared access
          </p>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
            Buyers who currently have access to this horse&apos;s private documents will appear here.
          </p>
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.grantId}
            className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--muted)]/45 p-5"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-[color:var(--foreground-strong)]">
                    {item.buyer.label}
                  </h3>
                  <span className="rounded-full bg-[rgba(45,84,56,0.14)] px-3 py-1 text-xs font-medium text-[color:var(--foreground-strong)]">
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
                    Last shared:{" "}
                    <span className="font-medium">{formatDateTime(item.sharedAt)}</span>
                  </p>
                  <p>
                    Current files:{" "}
                    <span className="font-medium">{item.documents.length}</span>
                  </p>
                </div>

                {item.note ? (
                  <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-sm text-[color:var(--foreground)]">
                    Barn note: {item.note}
                  </div>
                ) : null}

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                    Current shared documents
                  </p>

                  {item.documents.length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-4 text-sm text-[color:var(--foreground-soft)]">
                      No currently shared files. This buyer still has an active grant, but the documents in that grant are no longer available.
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

              {item.canRevoke ? (
                <div className="w-full lg:w-auto lg:min-w-56">
                  <GrantRevokeButton grantId={item.grantId} />
                </div>
              ) : null}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
