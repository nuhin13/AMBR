import { db } from "@/lib/db";
import { requireUser } from "@/modules/auth/session";
import { listProducts } from "@/modules/catalog/queries";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const { t, locale } = await getT();
  const saved = await db.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } });
  const ids = new Set(saved.map((s) => s.productId));
  const { items } = await listProducts({ pageSize: 500 }, locale);
  const products = items.filter((p) => ids.has(p.id));
  return (
    <div>
      <h2 className="t-h3 mb-8">{t.account.wishlist}</h2>
      {products.length === 0 ? (
        <EmptyState title={t.account.wishlistEmpty} description={t.account.wishlistEmptyText} action={<ButtonLink href={localePath(locale, "/shop")}>{t.account.browse}</ButtonLink>} />
      ) : (
        <ProductGrid products={products} columns="three" />
      )}
    </div>
  );
}
