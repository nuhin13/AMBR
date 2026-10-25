"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { retryPaymentAction, switchToCodAction } from "@/modules/checkout/actions";

export function PaymentRetry({ orderNumber, token, methodLabel, codAvailable }: { orderNumber: string; token: string; methodLabel: string; codAvailable: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const go = (fn: () => ReturnType<typeof retryPaymentAction>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) return setError(r.error);
      const url = r.data!.redirectUrl;
      if (url.startsWith("http")) window.location.href = url;
      else router.push(url);
    });
  return (
    <div className="mt-8 flex flex-col gap-3">
      <Button size="lg" loading={pending} onClick={() => go(() => retryPaymentAction(orderNumber, token))}>Pay with {methodLabel}</Button>
      {codAvailable && (
        <Button size="lg" variant="secondary" disabled={pending} onClick={() => go(() => switchToCodAction(orderNumber, token))}>
          Switch to Cash on Delivery
        </Button>
      )}
      {error && <p className="text-[14px] text-error" role="alert">{error}</p>}
    </div>
  );
}
