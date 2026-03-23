import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { requireAdminPageSession } from "@/lib/auth/admin";
import AdminSectionNav from "@/components/admin/admin-section-nav";
import AdminEquiTagOrderForm from "@/components/admin/admin-equitag-order-form";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  PRINTING: { label: "Printing", className: "bg-purple-100 text-purple-800" },
  SHIPPED: { label: "Shipped", className: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
};

export default async function AdminEquiTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminPageSession();

  const params = await searchParams;
  const statusFilter = params.status || "";
  const search = params.q || "";

  const where: Record<string, unknown> = {};

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (search) {
    where.OR = [
      { equiTag: { code: { contains: search, mode: "insensitive" } } },
      { equiTag: { attachedHorse: { name: { contains: search, mode: "insensitive" } } } },
      { sellerProfile: { displayName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const orders = await prisma.equiTagOrder.findMany({
    where,
    include: {
      equiTag: {
        include: {
          attachedHorse: { select: { name: true } },
        },
      },
      sellerProfile: { select: { displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex min-h-screen">

      <main className="flex-1 overflow-y-auto bg-[color:var(--background)] text-[color:var(--foreground)]">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <p className="mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            Admin &middot; EquiTags
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
            Physical EquiTag Orders
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)]">
            Manage, update, and track all physical EquiTag orders placed by sellers.
          </p>

          {/* Filters */}
          <form className="mt-6 flex flex-wrap items-center gap-3">
            <input
              name="q"
              defaultValue={search}
              placeholder="Search horse, tag code, or barn…"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm w-64"
            />
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
            <button
              type="submit"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm font-semibold hover:bg-[color:var(--muted)]"
            >
              Filter
            </button>
            <Link
              href="/admin/equitags"
              className="text-sm text-[color:var(--foreground-soft)] underline underline-offset-4"
            >
              Reset
            </Link>
          </form>

          {/* Orders */}
          {orders.length === 0 ? (
            <p className="mt-10 text-[color:var(--foreground-soft)]">No orders found.</p>
          ) : (
            <div className="mt-8 space-y-5">
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
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
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
                          <span>Barn: {order.sellerProfile?.displayName ?? "—"}</span>
                          <span>
                            {order.createdAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {order.shippingName && (
                          <p className="text-sm text-[color:var(--foreground-soft)]">
                            Ship to: {order.shippingName}, {order.shippingCity} {order.shippingState} {order.shippingPostalCode} {order.shippingCountry}
                          </p>
                        )}
                        {order.equiTag && (
                          <Link
                            href={`/api/admin/equitag-orders/${order.id}/export`}
                            className="inline-flex text-xs font-semibold text-[color:var(--foreground-soft)] underline underline-offset-4 hover:text-[color:var(--foreground-strong)]"
                          >
                            Download QR
                          </Link>
                        )}
                      </div>

                      <AdminEquiTagOrderForm
                        orderId={order.id}
                        currentStatus={order.status}
                        deliveryCarrier={order.deliveryCompany ?? ""}
                        deliveryTrackingNumber={order.trackingCode ?? ""}
                        estimatedDeliveryDate={order.estimatedDeliveryDate ? order.estimatedDeliveryDate.toISOString().slice(0, 10) : ""}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
