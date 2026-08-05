import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AdminBlockedNotice from "@/components/admin/admin-blocked-notice";
import SellerAppHeader from "@/components/layout/seller-app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import UploadHorseDocumentForm from "@/components/horses/upload-horse-document-form";
import ShareDocumentsButton from "@/components/horses/share-documents-button";
import SellerHorseVaultSharedAccess from "@/components/seller/seller-horse-vault-shared-access";
import VaultDocumentActions from "@/components/horses/vault-document-actions";
import { getHorseWriteBlockError } from "@/lib/admin/moderation";
import { formatDocumentCategory } from "@/lib/vault/document-categories";
import { mapSellerHorseVaultSharedAccess } from "@/lib/vault/shared-access";

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

export default async function SellerHorseVaultPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      displayName: true,
    },
  });

  if (!seller) {
    redirect("/mybarn/onboard");
  }

  const horse = await prisma.horse.findFirst({
    where: {
      id,
      sellerProfileId: seller.id,
    },
    include: {
      sellerProfile: {
        select: {
          adminDisabledAt: true,
          adminDisableReason: true,
        },
      },
      documents: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          uploadedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      accessGrants: {
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
          note: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
          revokedAt: true,
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          grantedFiles: {
            select: {
              horseDocumentId: true,
              horseDocument: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                  deletedAt: true,
                },
              },
            },
          },
          messages: {
            where: {
              messageType: "GRANT",
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              metadata: true,
              createdAt: true,
            },
          },
          vaultActivities: {
            where: {
              activityType: "ACCESS_REQUEST_APPROVED",
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              metadata: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!horse) {
    notFound();
  }

  const horseWriteBlocked = getHorseWriteBlockError(horse);
  const sharedAccessItems = mapSellerHorseVaultSharedAccess(horse.accessGrants);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SellerAppHeader />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
              {seller.displayName}
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
              {horse.name}&rsquo;s HorseVault
            </h1>
            <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
              Upload private documents that buyers can access only after approval.
            </p>
          </div>

          <Link href="/mybarn/horsevault">
            <Button variant="outline">Back to HorseVault</Button>
          </Link>
        </div>

        {horseWriteBlocked ? (
          <AdminBlockedNotice
            title="Horse vault is disabled"
            message={horseWriteBlocked}
          />
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <Card className="rounded-[2rem] border-[color:var(--border)] shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                    Upload document
                  </CardTitle>
                  <CardDescription>
                    Add veterinary records, videos, X-rays, pedigree documents, or any other private files.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadHorseDocumentForm horseId={horse.id} />
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-[color:var(--border)] shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                    Vault documents
                  </CardTitle>
                  <CardDescription>
                    Documents currently stored for this horse.
                  </CardDescription>
                  {horse.documents.length > 0 ? (
                    <CardAction>
                      <ShareDocumentsButton
                        horseId={horse.id}
                        horseName={horse.name}
                        documents={horse.documents.map((doc) => ({
                          id: doc.id,
                          title: doc.title,
                          fileName: doc.fileName,
                          category: doc.category,
                        }))}
                      />
                    </CardAction>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {horse.documents.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-[color:var(--border)] bg-[color:var(--muted)]/50 p-8 text-center">
                      <p className="text-lg font-semibold text-[color:var(--foreground-strong)]">
                        No documents yet
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                        Upload the first private file for this horse.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {horse.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--muted)]/45 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-[color:var(--foreground-strong)]">
                                {doc.title}
                              </h3>
                              <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                                {doc.fileName}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-[color:var(--background-elevated)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
                                  {formatDocumentCategory(doc.category)}
                                </span>
                                <span className="rounded-full bg-[color:var(--background-elevated)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
                                  {formatBytes(doc.fileSizeBytes)}
                                </span>
                                <span className="rounded-full bg-[color:var(--background-elevated)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
                                  {doc.mimeType || "Unknown file type"}
                                </span>
                              </div>
                              <p className="mt-3 text-xs text-[color:var(--foreground-soft)]">
                                Uploaded by {doc.uploadedBy.name || doc.uploadedBy.email || "Unknown user"} on{" "}
                                {new Date(doc.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className="rounded-full bg-[rgba(45,84,56,0.14)] px-3 py-1 text-xs font-medium text-[color:var(--foreground-strong)]">
                                Private
                              </span>
                              <VaultDocumentActions
                                horseId={horse.id}
                                document={{
                                  id: doc.id,
                                  title: doc.title,
                                  category: doc.category,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card className="rounded-[2rem] border-[color:var(--border)] shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                    Shared access
                  </CardTitle>
                  <CardDescription>
                    Manage buyers who currently have access to this horse&apos;s private documents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SellerHorseVaultSharedAccess items={sharedAccessItems} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
