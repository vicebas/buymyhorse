import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
import GrantRevokeButton from "@/components/seller/grant-revoke-button";
import RequestActionButtons from "@/components/seller/request-action-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SellerRequestsPage() {
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

  const requests = await prisma.accessRequest.findMany({
    where: {
      horse: {
        sellerProfileId: seller.id,
      },
    },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
          image: true,
          documents: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              title: true,
              category: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      requestedCategories: {
        select: {
          category: true,
        },
      },
      requestedFiles: {
        select: {
          horseDocumentId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const grants = await prisma.accessGrant.findMany({
    where: {
      horse: {
        sellerProfileId: seller.id,
      },
    },
    select: {
      id: true,
      horseId: true,
      buyerId: true,
      expiresAt: true,
      revokedAt: true,
      note: true,
    },
  });

  const grantMap = new Map(
    grants.map((grant) => [`${grant.horseId}:${grant.buyerId}`, grant] as const)
  );

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="seller" />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            Seller Requests
          </p>
          <h1 className="mt-2 font-serif text-4xl">Vault Access Requests</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Review buyer requests for private horse documents and decide who gets access.
          </p>
        </div>

        {requests.length === 0 ? (
          <Card className="rounded-3xl border-stone-200 shadow-sm">
            <CardContent className="p-10 text-center">
              <p className="text-lg text-stone-700">No requests yet</p>
              <p className="mt-2 text-sm text-stone-500">
                Buyer access requests will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const grant = grantMap.get(`${request.horse.id}:${request.buyer.id}`);

              return (
              <Card key={request.id} className="rounded-3xl border-stone-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="font-serif text-2xl text-stone-900">
                      {request.horse.name}
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                        request.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : request.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : request.status === "REVOKED"
                          ? "bg-rose-100 text-rose-700"
                          : request.status === "EXPIRED"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {request.status}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Buyer
                      </p>
                      <p className="mt-1 text-sm font-medium text-stone-900">
                        {request.buyer.name || "Unnamed buyer"}
                      </p>
                      <p className="text-sm text-stone-500">{request.buyer.email}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Requested At
                      </p>
                      <p className="mt-1 text-sm text-stone-900">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Message
                      </p>
                      <p className="mt-1 text-sm text-stone-900">
                        {request.message || "No message provided"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Requested Categories
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {request.requestedCategories.length === 0 ? (
                          <span className="text-sm text-stone-500">None selected</span>
                        ) : (
                          request.requestedCategories.map((entry) => (
                            <span
                              key={entry.category}
                              className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
                            >
                              {entry.category.replaceAll("_", " ")}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Intended Use
                      </p>
                      <p className="mt-2 text-sm text-stone-900">
                        {request.intendedUse || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      Requested Files
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {request.requestedFiles.length === 0 ? (
                        <span className="text-sm text-stone-500">No specific files requested</span>
                      ) : (
                        request.horse.documents
                          .filter((document) =>
                            request.requestedFiles.some(
                              (entry) => entry.horseDocumentId === document.id
                            )
                          )
                          .map((document) => (
                            <span
                              key={document.id}
                              className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
                            >
                              {document.title}
                            </span>
                          ))
                      )}
                    </div>
                  </div>

                  {grant ? (
                    <div className="rounded-2xl border border-stone-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Current Grant
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-stone-700">
                        <p>
                          Status:{" "}
                          <span className="font-medium">
                            {grant.revokedAt
                              ? "Revoked"
                              : grant.expiresAt && grant.expiresAt <= new Date()
                              ? "Expired"
                              : "Active"}
                          </span>
                        </p>
                        <p>
                          Expires:{" "}
                          <span className="font-medium">
                            {grant.expiresAt
                              ? new Date(grant.expiresAt).toLocaleString()
                              : "No expiration"}
                          </span>
                        </p>
                        <p>
                          Seller note:{" "}
                          <span className="font-medium">{grant.note || "None"}</span>
                        </p>
                      </div>

                      {!grant.revokedAt &&
                      (!grant.expiresAt || grant.expiresAt > new Date()) ? (
                        <div className="mt-4">
                          <GrantRevokeButton grantId={grant.id} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {request.status === "PENDING" ? (
                    <RequestActionButtons
                      requestId={request.id}
                      requestedCategories={request.requestedCategories.map(
                        (entry) => entry.category
                      )}
                      requestedFileIds={request.requestedFiles.map(
                        (entry) => entry.horseDocumentId
                      )}
                      availableDocuments={request.horse.documents}
                    />
                  ) : null}
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
