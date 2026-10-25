import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Breadcrumbs } from "@/components/layout/page-intro";
import { LLink } from "@/components/i18n/llink";
import { db } from "@/lib/db";
import { toLocalPhone } from "@/lib/phone";
import { getCartView } from "@/modules/cart/service";
import { getCurrentUser } from "@/modules/auth/session";
import { getCheckoutGeography } from "@/modules/shipping/service";
import { availableMethods } from "@/modules/payments/availability";
import { getSettings } from "@/modules/content/settings";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.checkout, robots: { index: false } };
}

export default async function CheckoutPage() {
  const { t, locale } = await getT();
  const cart = await getCartView();
  if (cart.lines.length === 0) redirect(localePath(locale, "/cart"));
  const [geo, methods, user, settings] = await Promise.all([getCheckoutGeography(locale), availableMethods(), getCurrentUser(), getSettings()]);
  const address = user ? await db.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] }) : null;
  return (
    <div className="container-wide pb-24 pt-6 md:pt-8">
      <Breadcrumbs items={[{ href: "/cart", label: t.common.bag }, { label: t.checkout.title }]} />
      <h1 className="t-h1 mt-10">{t.checkout.title}</h1>
      {!user && (
        <p className="mt-3 text-[14px] text-muted">
          {t.checkout.guestNote} <LLink href="/login?next=/checkout" className="link-underline text-burgundy">{t.checkout.signInPrompt}</LLink> {t.checkout.signInSuffix}
        </p>
      )}
      <CheckoutForm
        geography={geo}
        methods={methods}
        codNote={locale === "bn" ? settings.payments.codNoteBn : settings.payments.codNote}
        signedIn={Boolean(user)}
        defaults={{
          customerName: address?.recipientName ?? user?.name ?? "",
          phone: address ? toLocalPhone(address.phone) : user?.phone ? toLocalPhone(user.phone) : "",
          email: user?.email ?? "",
          districtId: address?.districtId ?? 0,
          upazilaId: address?.upazilaId ?? 0,
          addressLine: address?.line ?? "",
        }}
      />
    </div>
  );
}
