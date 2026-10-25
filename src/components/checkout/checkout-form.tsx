"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import type { PaymentMethod } from "@prisma/client";
import { checkoutSchema, type CheckoutInput } from "@/modules/checkout/schema";
import { placeOrderAction } from "@/modules/checkout/actions";
import { useStore } from "@/components/cart/store-provider";
import { CouponField } from "@/components/cart/coupon-field";
import { ProductImage } from "@/components/product/product-image";
import { LLink } from "@/components/i18n/llink";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { trackBeginCheckout } from "@/components/analytics/events";
import { useI18n } from "@/i18n/client";
import { translateMessage } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import { shippingFee } from "@/modules/pricing";

type Geo = {
  districts: { id: number; name: string; nameBn: string | null; shippingZoneId: string; upazilas: { id: number; name: string; nameBn: string | null; shippingZoneId: string | null; isCityArea: boolean }[] }[];
  zones: { id: string; name: string; fee: number; freeShippingThreshold: number | null; estimatedDays: string }[];
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
  const { t, fmt, price, locale } = useI18n();
  const [submitting, start] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [key] = useState(() => crypto.randomUUID());
  const place = (n: { name: string; nameBn: string | null }) => (locale === "bn" && n.nameBn ? n.nameBn : n.name);

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
  const err = (name: keyof FormValues) => {
    const m = formState.errors[name]?.message;
    return m ? translateMessage(t, String(m)) : undefined;
  };
  const districtId = Number(useWatch({ control, name: "districtId" })) || 0;
  const upazilaId = Number(useWatch({ control, name: "upazilaId" })) || 0;
  const method = useWatch({ control, name: "paymentMethod" });

  const districts = useMemo(() => [...geography.districts].sort((a, b) => place(a).localeCompare(place(b), locale === "bn" ? "bn" : "en")), [geography.districts, locale]); // eslint-disable-line react-hooks/exhaustive-deps
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
        {t.cart.empty}. <LLink href="/shop" className="link-underline text-burgundy">{t.common.continueShopping}</LLink>
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

  const agree = fmt(t.checkout.agree, { terms: "\u0000", returns: "\u0001" }).split(/([\u0000\u0001])/);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-16">
      <div className="space-y-14 lg:col-span-7">
        <section aria-labelledby="contact-h">
          <h2 id="contact-h" className="t-h3 mb-6 flex items-baseline gap-4"><Step n={1} />{t.checkout.contact}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label={t.checkout.fullName} autoComplete="name" required error={err("customerName")} {...register("customerName")} className="sm:col-span-2" />
            <Input label={t.checkout.mobile} type="tel" inputMode="tel" autoComplete="tel-national" prefix="+88" placeholder="01XXXXXXXXX" required error={err("phone")} hint={t.checkout.mobileHint} {...register("phone")} />
            <Input label={t.checkout.email} type="email" autoComplete="email" error={err("email")} hint={t.checkout.emailHint} {...register("email")} />
          </div>
        </section>

        <section aria-labelledby="addr-h">
          <h2 id="addr-h" className="t-h3 mb-6 flex items-baseline gap-4"><Step n={2} />{t.checkout.address}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select label={t.checkout.district} required error={err("districtId")} {...register("districtId", { onChange: () => setValue("upazilaId", "" as unknown as number) })}>
              <option value="">{t.checkout.chooseDistrict}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{locale === "bn" ? `${place(d)}${d.nameBn ? ` · ${d.name}` : ""}` : `${d.name}${d.nameBn ? ` · ${d.nameBn}` : ""}`}</option>
              ))}
            </Select>
            <Select label={t.checkout.area} required disabled={!district} error={err("upazilaId")} {...register("upazilaId")}>
              <option value="">{district ? t.checkout.chooseArea : t.checkout.chooseDistrictFirst}</option>
              {cityAreas.length > 0 && (
                <optgroup label={fmt(t.checkout.cityAreas, { district: district ? place(district) : "" })}>
                  {cityAreas.map((u) => <option key={u.id} value={u.id}>{place(u)}</option>)}
                </optgroup>
              )}
              {otherAreas.length > 0 && (
                <optgroup label={t.checkout.upazilas}>
                  {otherAreas.map((u) => <option key={u.id} value={u.id}>{place(u)}</option>)}
                </optgroup>
              )}
            </Select>
            <Textarea label={t.checkout.fullAddress} required rows={2} placeholder={t.checkout.fullAddressPlaceholder} error={err("addressLine")} {...register("addressLine")} className="sm:col-span-2" />
            <Textarea label={t.checkout.instructions} rows={2} placeholder={t.checkout.instructionsPlaceholder} error={err("deliveryInstructions")} {...register("deliveryInstructions")} className="sm:col-span-2" />
            {signedIn && <Checkbox label={t.checkout.saveAddress} {...register("saveAddress")} className="sm:col-span-2" />}
          </div>
          {zone && <p className="mt-5 text-[13.5px] text-muted">{fmt(t.checkout.deliveringTo, { zone: zone.name, days: zone.estimatedDays })}</p>}
        </section>

        <section aria-labelledby="pay-h">
          <h2 id="pay-h" className="t-h3 mb-6 flex items-baseline gap-4"><Step n={3} />{t.checkout.payment}</h2>
          {methods.length === 0 ? (
            <p className="text-error">{t.checkout.noMethods}</p>
          ) : (
            <div className="divide-y divide-burgundy/12 border-y border-burgundy/12" role="radiogroup" aria-label={t.checkout.payment}>
              {methods.map((m) => (
                <label key={m} className="flex cursor-pointer items-start gap-4 py-5">
                  <input type="radio" value={m} {...register("paymentMethod")} className="mt-1.5 size-4 accent-burgundy" />
                  <span>
                    <span className={cn("block font-serif text-[19px]", method === m ? "text-burgundy" : "text-charcoal")}>{t.labels.paymentMethod[m]}</span>
                    <span className="mt-0.5 block text-[13.5px] text-muted">{m === "COD" ? codNote : t.checkout.methodInfo[m]}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {err("paymentMethod") && <p className="mt-2 text-[13px] text-error">{err("paymentMethod")}</p>}
        </section>
      </div>

      <aside className="lg:sticky lg:top-[100px] lg:col-span-4 lg:col-start-9 lg:self-start">
        <div className="space-y-6 bg-cream-light p-6 md:p-7">
          <h2 className="t-h3">{t.checkout.summary}</h2>
          <ul className="divide-y divide-burgundy/10">
            {cart.lines.map((l) => (
              <li key={l.id} className="flex gap-3 py-3">
                <div className="relative w-14 shrink-0">
                  <ProductImage src={l.imageUrl} name={l.productName} sizes="56px" />
                  <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-burgundy text-[10px] text-cream">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1 text-[14px]">
                  <p className="truncate font-serif text-[16px] text-burgundy">{l.productName}</p>
                  <p className="text-muted">{l.variantLabel}</p>
                </div>
                <p className="text-[14px] tabular-nums">{price(l.unitPrice * l.quantity)}</p>
              </li>
            ))}
          </ul>
          <CouponField />
          <dl className="space-y-2 text-[14.5px]">
            <div className="flex justify-between"><dt className="text-muted">{t.cart.subtotal}</dt><dd className="tabular-nums">{price(cart.subtotal)}</dd></div>
            {cart.discount > 0 && <div className="flex justify-between text-success"><dt>{t.cart.discount}</dt><dd className="tabular-nums">−{price(cart.discount)}</dd></div>}
            <div className="flex justify-between">
              <dt className="text-muted">{t.cart.delivery}</dt>
              <dd className="tabular-nums">{fee === null ? <span className="text-muted">{t.checkout.chooseYourArea}</span> : fee === 0 ? t.cart.free : price(fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-burgundy/15 pt-4 text-[18px]">
              <dt>{t.cart.total}</dt>
              <dd className="tabular-nums text-burgundy">{price(total)}</dd>
            </div>
          </dl>
          <Checkbox
            label={
              <>
                {agree.map((part, i) =>
                  part === "\u0000" ? <LLink key={i} href="/policies/terms" target="_blank" className="link-underline text-burgundy">{t.checkout.terms}</LLink>
                  : part === "\u0001" ? <LLink key={i} href="/policies/returns" target="_blank" className="link-underline text-burgundy">{t.checkout.returnPolicy}</LLink>
                  : <span key={i}>{part}</span>,
                )}
              </>
            }
            error={err("acceptTerms")}
            {...register("acceptTerms")}
          />
          {serverError && <p className="border-l-2 border-error pl-3 text-[13.5px] text-error" role="alert">{serverError}</p>}
          <Button type="submit" size="lg" full loading={submitting} disabled={cart.hasIssues || methods.length === 0}>
            {fmt(method === "COD" ? t.checkout.placeOrder : t.checkout.continueToPayment, { total: price(total) })}
          </Button>
          <p className="flex items-center justify-center gap-2 text-[12px] text-muted"><Lock className="size-3.5" /> {t.checkout.secure}</p>
        </div>
      </aside>
    </form>
  );
}

function Step({ n }: { n: number }) {
  return <span className="font-serif text-[15px] italic text-rose">{String(n).padStart(2, "0")}</span>;
}
