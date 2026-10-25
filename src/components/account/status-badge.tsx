"use client";

import type { OrderStatus } from "@prisma/client";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  const tone = status === "DELIVERED" ? "text-success" : status === "CANCELLED" || status === "RETURNED" ? "text-error" : "text-burgundy";
  return <span className={cn("eyebrow text-[10.5px]", tone)}>{t.labels.orderStatus[status]}</span>;
}
