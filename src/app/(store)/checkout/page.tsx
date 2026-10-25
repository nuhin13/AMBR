import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Breadcrumbs } from "@/components/layout/page-header";
import { db } from "@/lib/db";
import { toLocalPhone } from "@/lib/phone";
import { getCartView } from "@/modules/cart/service";
import { getCurrentUser } from "@/modules/auth/session";
import { getCheckoutGeography } from "@/modules/shipping/service";
import { availableMethods } from "@/modules/payments/availability";
import { getSettings } from "@/modules/content/settings";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await getCartView();
  if (cart.lines.length === 0) redirect("/cart");
  const [geo, methods, user, settings] = await Promise.all([getCheckoutGeography(), availableMethods(), getCurrentUser(), getSettings()]);
  const address = user
    ? await db.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] })
    : null;
  return (
    <div className="container-x pb-20 pt-6 md:pt-8">
      <Breadcrumbs items={[{ href: "/cart", label: "Bag" }, { label: "Checkout" }]} />
      <h1 className="mt-6 text-[34px] md:text-[46px]">Checkout</h1>
      {!user && (
        <p className="mt-2 text-[14px] text-muted">
          Checking out as a guest. <a href="/login?next=/checkout" className="text-burgundy underline underline-offset-4">Sign in</a> to use saved addresses.
        </p>
      )}
      <CheckoutForm
        geography={geo}
        methods={methods}
        codNote={settings.payments.codNote}
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
