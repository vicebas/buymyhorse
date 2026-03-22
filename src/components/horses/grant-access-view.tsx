import Link from "next/link";

import { formatDocumentCategory } from "@/lib/vault/document-categories";
import type { BuyerHorseAccessStatus } from "@/lib/vault/access";

type AccessDocument = {
  id: string;
  title: string;
  fileName: string;
  fileSizeBytes: number | null;
  category: string;
};

type AccessGrantView = {
  id: string;
  expiresAt: Date | null;
  note: string | null;
  grantedBySeller?: {
    displayName: string;
  } | null;
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "Unknown size";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function GrantAccessView({
  horseId,
  horseName,
  status,
  grant,
  documents,
}: {
  horseId: string;
  horseName: string;
  status: BuyerHorseAccessStatus;
  grant: AccessGrantView | null;
  documents: AccessDocument[];
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
          Document Access
        </p>
        <h1 className="mt-2 font-serif text-4xl">{horseName ? `${horseName} Vault` : "Horse Vault"}</h1>
        <p className="mt-3 max-w-2xl text-stone-600">
          Access is provided for convenience and does not replace due diligence.
        </p>
      </div>

      {status !== "ACTIVE" ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-10 shadow-sm">
          <h2 className="font-serif text-3xl text-stone-900">
            {status === "NONE"
              ? "No approved access yet"
              : status === "EXPIRED"
              ? "Your access has expired"
              : "Your access has been revoked"}
          </h2>
          <p className="mt-3 text-stone-600">
            {status === "NONE"
              ? "Request access from the horse page to view private documents."
              : "Please contact the seller if you need renewed access to these files."}
          </p>
          <div className="mt-6">
            <Link
              href={`/horses/${horseId}`}
              className="inline-flex rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900"
            >
              Back to Horse Page
            </Link>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-10 shadow-sm">
          <h2 className="font-serif text-3xl text-stone-900">No files shared yet</h2>
          <p className="mt-3 text-stone-600">
            Your access is active, but there are no files available in the shared scope yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grant?.expiresAt ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Access expires on {new Date(grant.expiresAt).toLocaleString()}.
            </div>
          ) : null}

          {grant?.grantedBySeller?.displayName ? (
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">
              Access shared by {grant.grantedBySeller.displayName}.
            </div>
          ) : null}

          {grant?.note ? (
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">
              Barn note: {grant.note}
            </div>
          ) : null}

          {documents.map((document) => (
            <div
              key={document.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">{document.title}</h2>
                  <p className="mt-1 text-sm text-stone-500">{document.fileName}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
                    <span>{formatDocumentCategory(document.category)}</span>
                    <span>{formatBytes(document.fileSizeBytes)}</span>
                  </div>
                </div>

                <Link
                  href={`/api/grants/${grant?.id}/documents/${document.id}/download`}
                  className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Download
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
