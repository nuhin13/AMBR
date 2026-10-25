import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { CartPageView } from "@/components/cart/cart-page-view";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.bag, robots: { index: false } };
}

export default async function CartPage() {
  const { t } = await getT();
  return (
    <>
      <PageIntro crumbs={[{ label: t.common.bag }]} title={t.cart.title} />
      <div className="container-wide pb-24"><CartPageView /></div>
    </>
  );
}
