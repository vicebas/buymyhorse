import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FolderOpen, Package, FileText, ArrowLeft } from "lucide-react";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import SellerAppHeader from "@/components/layout/seller-app-header";
import { Button } from "@/components/ui/button";
import EquiTagOrderActions from "@/components/equitag/equitag-order-actions";
import { formatDateMDY } from "@/lib/formatting";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  PRINTING: { label: "Printing", className: "bg-purple-100 text-purple-800" },
  SHIPPED: { label: "Shipped", className: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
};

const ACTIVE_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "PRINTING", "SHIPPED"];

export default async function EquiTagOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ horse?: string; status?: string; showAll?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, horses: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
  });

  if (!seller) redirect("/mybarn/onboard");

  const params = await searchParams;
  const showAll = params.showAll === "1";
  const horseFilter = params.horse || "";
  const statusFilter = params.status || "";

  const where: Record<string, unknown> = {
    sellerProfileId: seller.id,
    canceledBySellerAt: null,
  };

  if (!showAll) {
    where.status = { in: ACTIVE_STATUSES };
  } else if (statusFilter) {
    where.status = statusFilter;
  }

  if (horseFilter) {
    where.equiTag = { attachedHorseId: horseFilter };
  }

  const orders = await prisma.equiTagOrder.findMany({
    where,
    include: {
      equiTag: {
        include: {
          attachedHorse: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <SellerAppHeader />

      <section className="border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href="/mybarn"
            className="inline-flex items-center gap-2 text-sm text-[color:var(--foreground-soft)] hover:text-[color:var(--foreground-strong)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to MyBarn
          </Link>

          <h1 className="mt-4 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
            EquiTag Orders
          </h1>
          <p className="mt-2 text-[color:var(--foreground-soft)]">
            Track your physical EquiTag orders.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="inline-flex rounded-xl bg-[color:var(--muted)] p-1">
          <Link
            href="/mybarn"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-md font-medium text-[color:var(--foreground-soft)]"
          >
            <FolderOpen className="h-4 w-4" />
            My Horses
          </Link>
          <Link
            href="/mybarn/equivault"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-md font-medium text-[color:var(--foreground-soft)]"
          >
            <FileText className="h-4 w-4" />
            EquiVault
          </Link>
          <Link
            href="/mybarn/requests"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-md font-medium text-[color:var(--foreground-soft)]"
          >
            <FileText className="h-4 w-4" />
            EquiVault Requests
          </Link>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--background-elevated)] px-5 py-2 text-md font-medium text-[color:var(--foreground-strong)] shadow-[var(--shadow-card)]">
            <Package className="h-4 w-4" />
            EquiTag Orders
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <form className="flex flex-wrap items-center gap-3">
            <select
              name="horse"
              defaultValue={horseFilter}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm"
            >
              <option value="">All horses</option>
              {seller.horses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_BADGES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <input type="hidden" name="showAll" value={showAll ? "1" : "0"} />

            <Button type="submit" variant="outline" size="sm">
              Filter
            </Button>
          </form>

          <Link
            href={showAll ? "/mybarn/equitag-orders" : "/mybarn/equitag-orders?showAll=1"}
            className="text-sm font-medium text-[color:var(--foreground-soft)] underline underline-offset-4 hover:text-[color:var(--foreground-strong)]"
          >
            {showAll ? "Hide completed" : "Show all"}
          </Link>
        </div>

        {/* Order list */}
        {orders.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--muted)]">
              <Package className="h-8 w-8 text-[color:var(--foreground-soft)]" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-[color:var(--foreground-strong)]">
              No orders yet
            </h2>
            <p className="mt-3 text-[color:var(--foreground-soft)]">
              Order physical EquiTags from any horse listing in your barn.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const badge = STATUS_BADGES[order.status] ?? {
                label: order.status,
                className: "bg-gray-100 text-gray-600",
              };

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-extrabold text-[color:var(--foreground-strong)]">
                          {order.equiTag?.attachedHorse?.name ?? "Unknown Horse"}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-[color:var(--foreground-soft)]">
                        <span>Tag: {order.equiTag?.code ?? "—"}</span>
                        <span>Qty: {order.quantity}</span>
                        <span>
                          Ordered: {formatDateMDY(order.createdAt)}
                        </span>
                      </div>
                      {order.deliveryCompany && (
                        <p className="text-sm text-[color:var(--foreground-soft)]">
                          Tracking: {order.deliveryCompany}{" "}
                          {order.trackingCode ?? ""}
                        </p>
                      )}
                      {order.estimatedDeliveryDate && (
                        <p className="text-sm text-[color:var(--foreground-soft)]">
                          Est. delivery: {formatDateMDY(order.estimatedDeliveryDate)}
                        </p>
                      )}
                      {order.status === "CANCELLED" && order.canceledByAdminAt ? (
                        <p className="text-sm text-[color:var(--foreground-soft)]">
                          This order was cancelled by admin.
                        </p>
                      ) : null}
                      {order.status === "PENDING_PAYMENT" ? (
                        <EquiTagOrderActions orderId={order.id} />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
