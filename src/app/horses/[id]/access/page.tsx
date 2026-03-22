import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import AppHeader from "@/components/layout/app-header";
import { authOptions } from "@/lib/auth/options";
import { getUserAppHeaderVariant } from "@/lib/auth/get-user-app-header-variant";
import { getBuyerHorseAccess } from "@/lib/vault/access";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "Unknown size";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default async function HorseAccessPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const headerVariant = await getUserAppHeaderVariant(session.user.id);
  const access = await getBuyerHorseAccess(session.user.id, id);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant={headerVariant} />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            Document Access
          </p>
          <h1 className="mt-2 font-serif text-4xl">
            {access.horse ? `${access.horse.name} Vault` : "Horse Vault"}
          </h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Access is provided for convenience and does not replace due diligence.
          </p>
        </div>

        {access.status !== "ACTIVE" ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-10 shadow-sm">
            <h2 className="font-serif text-3xl text-stone-900">
              {access.status === "NONE"
                ? "No approved access yet"
                : access.status === "EXPIRED"
                ? "Your access has expired"
                : "Your access has been revoked"}
            </h2>
            <p className="mt-3 text-stone-600">
              {access.status === "NONE"
                ? "Request access from the horse page to view private documents."
                : "Please contact the seller if you need renewed access to these files."}
            </p>
            <div className="mt-6">
              <Link
                href={`/horses/${id}`}
                className="inline-flex rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900"
              >
                Back to Horse Page
              </Link>
            </div>
          </div>
        ) : access.documents.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-10 shadow-sm">
            <h2 className="font-serif text-3xl text-stone-900">No files shared yet</h2>
            <p className="mt-3 text-stone-600">
              Your access is active, but there are no files available in the shared scope yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {access.grant?.expiresAt ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Access expires on {new Date(access.grant.expiresAt).toLocaleString()}.
              </div>
            ) : null}

            {access.grant?.note ? (
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">
                Barn note: {access.grant.note}
              </div>
            ) : null}

            {access.documents.map((document) => (
              <div
                key={document.id}
                className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">{document.title}</h2>
                    <p className="mt-1 text-sm text-stone-500">{document.fileName}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
                      <span>{document.category.replaceAll("_", " ")}</span>
                      <span>{formatBytes(document.fileSizeBytes)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/api/horses/${id}/documents/${document.id}/download`}
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
    </main>
  );
}
