import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import SellerAppHeader from "@/components/layout/seller-app-header";
import SellerRequestsShell from "@/components/seller/seller-requests-shell";
import type { SellerVaultRequestItem } from "@/components/seller/seller-requests-shell";
import { Card, CardContent } from "@/components/ui/card";

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
    redirect("/mybarn/onboard");
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
        orderBy: {
          createdAt: "asc",
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

  const requestItems: SellerVaultRequestItem[] = requests.map((request) => {
    const grant = grantMap.get(`${request.horse.id}:${request.buyer.id}`);
    let grantSummary: SellerVaultRequestItem["grant"] = null;

    if (grant) {
      const grantStatus: NonNullable<SellerVaultRequestItem["grant"]>["status"] =
        grant.revokedAt
          ? "REVOKED"
          : grant.expiresAt && grant.expiresAt <= new Date()
            ? "EXPIRED"
            : "ACTIVE";

      grantSummary = {
        id: grant.id,
        status: grantStatus,
        expiresAt: grant.expiresAt?.toISOString() ?? null,
        note: grant.note,
        canRevoke: !grant.revokedAt && (!grant.expiresAt || grant.expiresAt > new Date()),
      };
    }

    return {
      id: request.id,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      intendedUse: request.intendedUse,
      message: request.message,
      categories: request.requestedCategories.map((entry) => entry.category),
      horse: {
        id: request.horse.id,
        name: request.horse.name,
      },
      buyer: {
        id: request.buyer.id,
        name: request.buyer.name,
        email: request.buyer.email,
      },
      availableDocuments: request.horse.documents,
      grant: grantSummary,
    };
  });

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <SellerAppHeader />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            Barn Requests
          </p>
          <h1 className="mt-2 text-4xl font-extrabold">Vault Access Requests</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
            Review buyer requests for private horse documents and manage approvals from a single workspace.
          </p>
        </div>

        {requestItems.length === 0 ? (
          <Card className="rounded-3xl border-[color:var(--border)] shadow-[var(--shadow-card)]">
            <CardContent className="p-10 text-center">
              <p className="text-lg text-[color:var(--foreground)]">No requests yet</p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                Buyer access requests will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <SellerRequestsShell requests={requestItems} />
        )}
      </section>
    </main>
  );
}
