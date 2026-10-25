"use client";

import { useEffect } from "react";
import { trackViewItem } from "@/components/analytics/events";

export function ViewTracker({ id, name, price }: { id: string; name: string; price: number }) {
  useEffect(() => {
    trackViewItem({ id, name, price });
  }, [id, name, price]);
  return null;
}
