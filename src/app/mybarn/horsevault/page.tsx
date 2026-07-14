import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FileText, FolderOpen, Package, Plus } from "lucide-react";

import EquiVaultGuardModal from "@/components/billing/equivault-guard-modal";
import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import { getUserAppHeaderVariant } from "@/lib/auth/get-user-app-header-variant";
import prisma from "@/lib/db/prisma";
import { formatDateMDY } from "@/lib/formatting";
import { formatDocumentCategory } from "@/lib/vault/document-categories";
import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";

export default async function MyBarnHorseVaultOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const headerVariant = await getUserAppHeaderVariant(session.user.id);

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      displayName: true,
      horses: {
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
          image: true,
          documents: {
            where: { deletedAt: null },
            orderBy: [{ updatedAt: "desc" }],
            select: {
              id: true,
              title: true,
              fileName: true,
              category: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!seller) {
    return (
      <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
        <ResolvedAppHeader variant={headerVariant} />

        <section className="border-b border-[color:var(--border)]">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
              HorseVault
            </p>
            <h1 className="mt-3 text-5xl font-extrabold text-[color:var(--foreground-strong)]">
              Create Your Barn First
            </h1>
            <p className="mt-3 max-w-3xl text-lg text-[color:var(--foreground-soft)]">
              HorseVault is organized inside your Barn so every horse&apos;s documents stay connected.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-8">
          <EquiVaultGuardModal
            onboardingHref="/mybarn/onboard?step=included"
            defaultOpen
            showStandaloneCard
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <ResolvedAppHeader variant={headerVariant} />

      <section className="border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            {seller.displayName}
          </p>
          <h1 className="mt-3 text-5xl font-extrabold text-[color:var(--foreground-strong)]">
            HorseVault
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-[color:var(--foreground-soft)]">
            Each horse has its own private HorseVault for veterinary records, Coggins, X-rays, videos, pedigrees, and other important documents.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="inline-flex rounded-xl bg-[color:var(--muted)] p-1">
          <Link
            href="/mybarn"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-md font-medium text-[color:var(--foreground-soft)]"
          >
            <FolderOpen className="h-4 w-4" />
            My Horses
          </Link>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--background-elevated)] px-5 py-2 text-md font-medium text-[color:var(--foreground-strong)] shadow-[var(--shadow-card)]">
            <FileText className="h-4 w-4" />
            HorseVault
          </button>
          <Link
            href="/mybarn/requests"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-md font-medium text-[color:var(--foreground-soft)]"
          >
            <FileText className="h-4 w-4" />
            HorseVault Requests
          </Link>
          <Link
            href="/mybarn/equitag-orders"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-md font-medium text-[color:var(--foreground-soft)]"
          >
            <Package className="h-4 w-4" />
            EquiTag Orders
          </Link>
        </div>

        {seller.horses.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-12 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-3xl font-extrabold text-[color:var(--foreground-strong)]">
              No horse profiles yet
            </h2>
            <p className="mt-3 text-sm text-[color:var(--foreground-soft)]">
              Add a horse profile first, then upload documents into HorseVault.
            </p>
            <Link href="/mybarn/horses/new" className="mt-6 inline-flex">
              <Button className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Horse
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5">
            {seller.horses.map((horse) => {
              const categories = Array.from(
                new Set(horse.documents.map((document) => formatDocumentCategory(document.category)))
              );
              const previewDocuments = horse.documents.slice(0, 4);
              const extraDocumentCount = Math.max(horse.documents.length - previewDocuments.length, 0);
              const lastUpdatedAt = horse.documents[0]?.updatedAt ?? null;

              return (
                <article
                  key={horse.id}
                  className="grid gap-5 rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)] lg:grid-cols-[160px_minmax(0,1fr)_auto]"
                >
                  <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                    <Image
                      src={resolvePublicAssetUrl(horse.image) || "/img/default-horse.png"}
                      alt={horse.name}
                      width={320}
                      height={240}
                      className="h-36 w-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">{horse.name}</h2>
                      <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                        {horse.documents.length} document{horse.documents.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-[color:var(--foreground-soft)]">
                      Categories: {categories.length > 0 ? categories.join(", ") : "No document categories yet"}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                      Last updated: {lastUpdatedAt ? formatDateMDY(lastUpdatedAt) : "No documents uploaded yet"}
                    </p>

                    {previewDocuments.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {previewDocuments.map((document) => (
                          <span
                            key={document.id}
                            className="rounded-full bg-[color:var(--background-elevated)] px-3 py-1 text-xs font-medium text-[color:var(--foreground-soft)]"
                          >
                            {document.title || document.fileName}
                          </span>
                        ))}
                        {extraDocumentCount > 0 ? (
                          <span className="rounded-full bg-[color:var(--background-elevated)] px-3 py-1 text-xs font-medium text-[color:var(--foreground-soft)]">
                            +{extraDocumentCount} more
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-4 text-sm text-[color:var(--foreground-soft)]">
                        No documents yet. Add documents to start building this horse&apos;s HorseVault.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <Link href={`/horses/${horse.id}`}>
                      <Button variant="outline">Open Horse Profile</Button>
                    </Link>
                    <Link href={`/mybarn/horses/${horse.id}/vault`}>
                      <Button variant="outline">Open HorseVault</Button>
                    </Link>
                    {horse.documents.length === 0 ? (
                      <Link href={`/mybarn/horses/${horse.id}/vault`}>
                        <Button className="btn-brand-green border-0">Add Documents</Button>
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
