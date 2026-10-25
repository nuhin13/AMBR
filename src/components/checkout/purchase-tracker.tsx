"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/components/analytics/events";

/** Fires the browser purchase event once per order (dedup key stored in sessionStorage). */
export function PurchaseTracker({ orderNumber, total, items }: { orderNumber: string; total: number; items: { id: string; name: string; variant: string; price: number; quantity: number }[] }) {
  useEffect(() => {
    try {
      const k = `ambr-tracked-${orderNumber}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* storage unavailable — still track once per page view */
    }
    trackPurchase(orderNumber, total, items);
  }, [orderNumber, total, items]);
  return null;
}
