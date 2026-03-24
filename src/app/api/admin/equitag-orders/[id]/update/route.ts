import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isAdminRole } from "@/lib/admin/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["CONFIRMED","CANCELLED"],
  CONFIRMED: ["PRINTING", "CANCELLED"],
  PRINTING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminRole(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, deliveryCarrier, deliveryTrackingNumber, estimatedDeliveryDate } = body;

  const order = await prisma.equiTagOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (status && status !== order.status) {
    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.equiTagOrder.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(status === "CANCELLED"
        ? {
            canceledByAdminAt: new Date(),
            canceledBySellerAt: null,
          }
        : status && status !== "CANCELLED"
          ? {
              canceledByAdminAt: null,
            }
          : {}),
      deliveryCompany: deliveryCarrier ?? order.deliveryCompany,
      trackingCode: deliveryTrackingNumber ?? order.trackingCode,
      estimatedDeliveryDate: estimatedDeliveryDate !== undefined
        ? (estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null)
        : order.estimatedDeliveryDate,
    },
  });

  return NextResponse.json({ ok: true, order: updated });
}
