import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/modules/orders/status";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === "DELIVERED" ? "success" : status === "CANCELLED" || status === "RETURNED" ? "error" : status === "PENDING" ? "gold" : "beige";
  return <Badge tone={tone}>{STATUS_LABEL[status]}</Badge>;
}
