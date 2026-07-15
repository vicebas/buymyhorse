export const OPEN_EQUITAG_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PRINTING",
  "SHIPPED",
] as const;

export const EQUITAG_ORDER_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  PRINTING: { label: "Printing", className: "bg-purple-100 text-purple-800" },
  SHIPPED: { label: "Shipped", className: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
};

export function getEquiTagOpenOrderMessage(status: string | null) {
  if (status === "PENDING_PAYMENT") {
    return "Checkout was not completed for the latest order. You can finish that order from EquiTag Orders or place another order now.";
  }

  if (status === "CONFIRMED" || status === "PRINTING" || status === "SHIPPED") {
    return "Another EquiTag order is already in progress for this tag. You can still place another order if you need more.";
  }

  return null;
}
