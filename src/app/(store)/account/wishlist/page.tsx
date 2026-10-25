import { db } from "@/lib/db";
import { requireUser } from "@/modules/auth/session";
import { listProducts } from "@/modules/catalog/queries";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const saved = await db.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true }, orderBy: { createdAt: "desc" } });
  const ids = new Set(saved.map((s) => s.productId));
  const { items } = await listProducts({ pageSize: 500 });
  const products = items.filter((p) => ids.has(p.id));
  return (
    <div>
      <h2 className="mb-6 text-[24px]">Wishlist</h2>
      {products.length === 0 ? (
        <EmptyState title="Nothing saved yet" description="Tap the heart on any fragrance to save it here." action={<ButtonLink href="/shop">Browse fragrances</ButtonLink>} />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
