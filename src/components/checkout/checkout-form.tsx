"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import type { PaymentMethod } from "@prisma/client";
import { checkoutSchema, type CheckoutInput } from "@/modules/checkout/schema";
import { placeOrderAction } from "@/modules/checkout/actions";
import { useStore } from "@/components/cart/store-provider";
import { CouponField } from "@/components/cart/coupon-field";
import { ProductImage } from "@/components/product/product-image";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { trackBeginCheckout } from "@/components/analytics/events";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { shippingFee } from "@/modules/pricing";

type Geo = {
  districts: { id: number; name: string; nameBn: string | null; shippingZoneId: string; upazilas: { id: number; name: string; shippingZoneId: string | null; isCityArea: boolean }[] }[];
  zones: { id: string; name: string; fee: number; freeShippingThreshold: number | null; estimatedDays: string }[];
};

const METHOD_INFO: Record<PaymentMethod, { title: string; body: string }> = {
  COD: { title: "Cash on Delivery", body: "Pay in cash when your order arrives." },
  BKASH: { title: "bKash", body: "Pay securely on bKash's official checkout." },
  NAGAD: { title: "Nagad", body: "Pay securely on Nagad's official checkout." },
  CARD: { title: "Debit / Credit Card", body: "Visa, Mastercard and more via SSLCommerz secure checkout." },
};

type FormValues = Omit<CheckoutInput, "acceptTerms"> & { acceptTerms: boolean };

export function CheckoutForm({
  geography,
  methods,
  codNote,
  signedIn,
  defaults,
}: {
  geography: Geo;
  methods: PaymentMethod[];
  codNote: string;
  signedIn: boolean;
  defaults: { customerName: string; phone: string; email: string; districtId: number; upazilaId: number; addressLine: string };
}) {
  const { cart } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [submitting, start] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [key] = useState(() => crypto.randomUUID());

  const form = useForm<FormValues>({
    resolver: zodResolver(checkoutSchema) as never,
    mode: "onTouched",
    defaultValues: {
      customerName: defaults.customerName,
      phone: defaults.phone,
      email: defaults.email,
      districtId: defaults.districtId || ("" as unknown as number),
      upazilaId: defaults.upazilaId || ("" as unknown as number),
      addressLine: defaults.addressLine,
      deliveryInstructions: "",
      paymentMethod: methods[0] ?? "COD",
      saveAddress: signedIn,
      acceptTerms: false,
      idempotencyKey: key,
    },
  });
  const { register, handleSubmit, formState, setValue, control } = form;
  const errors = formState.errors;
  const districtId = Number(useWatch({ control, name: "districtId" })) || 0;
  const upazilaId = Number(useWatch({ control, name: "upazilaId" })) || 0;
  const method = useWatch({ control, name: "paymentMethod" });

  const district = geography.districts.find((d) => d.id === districtId);
  const upazila = district?.upazilas.find((u) => u.id === upazilaId);
  const zone = useMemo(() => {
    if (!district) return null;
    const id = upazila?.shippingZoneId ?? district.shippingZoneId;
    return geography.zones.find((z) => z.id === id) ?? null;
  }, [district, upazila, geography.zones]);

  useEffect(() => {
    if (cart && cart.total > 0) trackBeginCheckout(cart.total, cart.count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id]);

  if (!cart) return <div className="mt-10 h-96 animate-pulse bg-beige/40" />;
  if (cart.lines.length === 0) {
    return (
      <p className="mt-10 text-muted">
        Your bag is empty. <Link href="/shop" className="text-burgundy underline">Continue shopping</Link>
      </p>
    );
  }

  const freeShip = cart.coupon?.ok ? cart.coupon.freeShipping : false;
  const fee = zone ? shippingFee(zone, cart.subtotal - cart.discount, freeShip) : null;
  const total = cart.total + (fee ?? 0);
  const cityAreas = district?.upazilas.filter((u) => u.isCityArea) ?? [];
  const otherAreas = district?.upazilas.filter((u) => !u.isCityArea) ?? [];

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    start(async () => {
      const r = await placeOrderAction({ ...values, idempotencyKey: key });
      if (!r.ok) {
        setServerError(r.error);
        if (r.fieldErrors) for (const [k, msg] of Object.entries(r.fieldErrors)) form.setError(k as keyof FormValues, { message: msg });
        toast(r.error, "error");
        return;
      }
      const url = r.data!.redirectUrl;
      if (url.startsWith("http")) window.location.href = url;
      else router.push(url);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">
      <div className="space-y-10">
        <section aria-labelledby="contact-h">
          <h2 id="contact-h" className="mb-5 flex items-center gap-3 text-[22px]"><Step n={1} />Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" autoComplete="name" required error={errors.customerName?.message} {...register("customerName")} className="sm:col-span-2" />
            <Input label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" prefix="+88" placeholder="01XXXXXXXXX" required error={errors.phone?.message} hint="We'll call or SMS about your delivery" {...register("phone")} />
            <Input label="Email (optional)" type="email" autoComplete="email" error={errors.email?.message} hint="For your order receipt" {...register("email")} />
          </div>
        </section>

        <section aria-labelledby="addr-h">
          <h2 id="addr-h" className="mb-5 flex items-center gap-3 text-[22px]"><Step n={2} />Delivery address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="District"
              required
              error={errors.districtId?.message}
              {...register("districtId", { onChange: () => setValue("upazilaId", "" as unknown as number) })}
            >
              <option value="">Choose district</option>
              {geography.districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}{d.nameBn ? ` · ${d.nameBn}` : ""}</option>
              ))}
            </Select>
            <Select label="City / Upazila / Area" required disabled={!district} error={errors.upazilaId?.message} {...register("upazilaId")}>
              <option value="">{district ? "Choose area" : "Choose district first"}</option>
              {cityAreas.length > 0 && (
                <optgroup label={`${district?.name} City`}>
                  {cityAreas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </optgroup>
              )}
              {otherAreas.length > 0 && (
                <optgroup label={cityAreas.length ? "Upazilas" : "Upazila"}>
                  {otherAreas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </optgroup>
              )}
            </Select>
            <Textarea label="Full address" required rows={2} placeholder="House, road, block/sector, area, landmark" error={errors.addressLine?.message} {...register("addressLine")} className="sm:col-span-2" />
            <Textarea label="Delivery instructions (optional)" rows={2} placeholder="e.g. Call before arriving; office hours only" error={errors.deliveryInstructions?.message} {...register("deliveryInstructions")} className="sm:col-span-2" />
            {signedIn && <Checkbox label="Save this address to my account" {...register("saveAddress")} className="sm:col-span-2" />}
          </div>
          {zone && (
            <p className="mt-4 text-[13.5px] text-muted">
              Delivering to <span className="text-charcoal">{zone.name}</span> · estimated {zone.estimatedDays}
            </p>
          )}
        </section>

        <section aria-labelledby="pay-h">
          <h2 id="pay-h" className="mb-5 flex items-center gap-3 text-[22px]"><Step n={3} />Payment</h2>
          {methods.length === 0 ? (
            <p className="text-error">No payment method is available right now. Please contact us to place your order.</p>
          ) : (
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
              {methods.map((m) => (
                <label key={m} className={cn("flex cursor-pointer items-start gap-4 border bg-white p-4 transition-colors", method === m ? "border-burgundy ring-1 ring-burgundy" : "border-beige hover:border-burgundy/50")}>
                  <input type="radio" value={m} {...register("paymentMethod")} className="mt-1 size-4 accent-burgundy" />
                  <span>
                    <span className="block font-medium text-charcoal">{METHOD_INFO[m].title}</span>
                    <span className="block text-[13.5px] text-muted">{m === "COD" ? codNote : METHOD_INFO[m].body}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {errors.paymentMethod && <p className="mt-2 text-[13px] text-error">{errors.paymentMethod.message}</p>}
        </section>
      </div>

      <aside className="lg:sticky lg:top-[120px] lg:self-start">
        <div className="space-y-5 bg-cream-light p-5 md:p-6">
          <h2 className="text-[22px]">Order summary</h2>
          <ul className="divide-y divide-beige">
            {cart.lines.map((l) => (
              <li key={l.id} className="flex gap-3 py-3">
                <div className="relative w-14 shrink-0">
                  <ProductImage src={l.imageUrl} name={l.productName} sizes="56px" />
                  <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-burgundy text-[10px] text-cream">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1 text-[14px]">
                  <p className="truncate font-serif text-[16px] text-burgundy">{l.productName}</p>
                  <p className="text-muted">{l.variantLabel}</p>
                  {l.issue && <p className="text-error">{l.issue}</p>}
                </div>
                <p className="text-[14px] tabular-nums">{formatBDT(l.unitPrice * l.quantity)}</p>
              </li>
            ))}
          </ul>
          <CouponField />
          <dl className="space-y-2 text-[14.5px]">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{formatBDT(cart.subtotal)}</dd></div>
            {cart.discount > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd className="tabular-nums">−{formatBDT(cart.discount)}</dd></div>}
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="tabular-nums">{fee === null ? <span className="text-muted">Choose your area</span> : fee === 0 ? "Free" : formatBDT(fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-beige pt-3 text-[17px] font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums text-burgundy">{formatBDT(total)}</dd>
            </div>
          </dl>
          <Checkbox
            label={<>I agree to the <Link href="/policies/terms" target="_blank" className="text-burgundy underline">terms</Link> and <Link href="/policies/returns" target="_blank" className="text-burgundy underline">return policy</Link>.</>}
            error={errors.acceptTerms?.message}
            {...register("acceptTerms")}
          />
          {serverError && <p className="border border-error/30 bg-error/5 p-3 text-[13.5px] text-error" role="alert">{serverError}</p>}
          <Button type="submit" size="lg" full loading={submitting} disabled={cart.hasIssues || methods.length === 0}>
            {method === "COD" ? `Place order · ${formatBDT(total)}` : `Continue to payment · ${formatBDT(total)}`}
          </Button>
          <p className="flex items-center justify-center gap-2 text-[12px] text-muted"><Lock className="size-3.5" /> Your details are sent securely</p>
        </div>
      </aside>
    </form>
  );
}

function Step({ n }: { n: number }) {
  return <span className="flex size-7 items-center justify-center rounded-full border border-burgundy font-sans text-[12px] text-burgundy">{n}</span>;
}
