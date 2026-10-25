import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata: Metadata = { title: "Your Bag", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Bag" }]} title="Your bag" />
      <div className="container-x py-10 md:py-14">
        <CartPageView />
      </div>
    </>
  );
}
