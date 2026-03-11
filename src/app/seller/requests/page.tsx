import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
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
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

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
            {requests.map((request) => (
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

                  {request.status === "PENDING" ? (
                    <RequestActionButtons requestId={request.id} />
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}