import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UploadHorseDocumentForm from "@/components/horses/upload-horse-document-form";

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
    redirect("/seller/onboard");
  }

  const horse = await prisma.horse.findFirst({
    where: {
      id,
      sellerProfileId: seller.id,
    },
    include: {
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
    },
  });

  if (!horse) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="seller" />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Horse Vault
            </p>
            <h1 className="mt-2 font-serif text-4xl">{horse.name}</h1>
            <p className="mt-3 max-w-2xl text-stone-600">
              Upload private documents that buyers can access only after approval.
            </p>
          </div>

          <Link href="/seller/horses">
            <Button variant="outline">Back to Horses</Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card className="rounded-3xl border-stone-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Upload document</CardTitle>
              <CardDescription>
                Add veterinary records, videos, X-rays, pedigree documents, or any other private files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadHorseDocumentForm horseId={horse.id} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-stone-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Vault documents</CardTitle>
              <CardDescription>
                Documents currently stored for this horse.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {horse.documents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center">
                  <p className="text-lg text-stone-700">No documents yet</p>
                  <p className="mt-2 text-sm text-stone-500">
                    Upload the first private file for this horse.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {horse.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-stone-900">{doc.title}</h3>
                          <p className="mt-1 text-sm text-stone-500">{doc.fileName}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-stone-400">
                            <span>{doc.category.replaceAll("_", " ")}</span>
                            <span>{formatBytes(doc.fileSizeBytes)}</span>
                            <span>{doc.mimeType || "Unknown file type"}</span>
                          </div>
                          <p className="mt-2 text-xs text-stone-500">
                            Uploaded by {doc.uploadedBy.name || doc.uploadedBy.email || "Unknown user"} on{" "}
                            {new Date(doc.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-700">
                            Private
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-600">
                            Category: {doc.category.replaceAll("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
