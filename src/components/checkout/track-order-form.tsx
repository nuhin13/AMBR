"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { trackOrderAction } from "@/modules/orders/actions";

export function TrackOrderForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setError(null);
          const r = await trackOrderAction({ orderNumber: fd.get("orderNumber"), phone: fd.get("phone") });
          if (r.ok) router.push(r.data!.redirectTo);
          else setError(r.fieldErrors ? Object.values(r.fieldErrors)[0] : r.error);
        });
      }}
    >
      <Input name="orderNumber" label="Order number" placeholder="AMB-261025-1234" required autoCapitalize="characters" />
      <Input name="phone" label="Mobile number" type="tel" placeholder="01XXXXXXXXX" required prefix="+88" />
      {error && <p className="text-[14px] text-error" role="alert">{error}</p>}
      <Button type="submit" full size="lg" loading={pending}>Track order</Button>
    </form>
  );
}
