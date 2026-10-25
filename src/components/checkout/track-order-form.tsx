"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { trackOrderAction } from "@/modules/orders/actions";
import { useI18n } from "@/i18n/client";

export function TrackOrderForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();
  return (
    <form
      className="space-y-6"
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
      <Input name="orderNumber" label={t.order.orderNumberLabel} placeholder="AMB-261025-1234" required autoCapitalize="characters" />
      <Input name="phone" label={t.checkout.mobile} type="tel" placeholder="01XXXXXXXXX" required prefix="+88" />
      {error && <p className="text-[14px] text-error" role="alert">{error}</p>}
      <Button type="submit" full size="lg" loading={pending}>{t.order.trackButton}</Button>
    </form>
  );
}
