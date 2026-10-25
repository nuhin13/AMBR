/**
 * Removes all DEMO data before launch:  npm run db:remove-demo
 * - demo orders (placed against demo products) and their payments/history
 * - demo products (variants, stock, images, notes) and collections left empty
 * - the DEMO10 coupon
 * Real orders are never touched. Products that appear on a real order are archived instead of deleted.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const demoOrders = await db.order.deleteMany({ where: { isDemo: true } });
  const demoProducts = await db.product.findMany({ where: { isDemo: true }, select: { id: true, name: true } });
  let deleted = 0;
  let archived = 0;
  for (const p of demoProducts) {
    const used = await db.orderItem.count({ where: { productId: p.id } });
    if (used > 0) {
      await db.product.update({ where: { id: p.id }, data: { status: "ARCHIVED" } });
      archived++;
    } else {
      await db.product.delete({ where: { id: p.id } });
      deleted++;
    }
  }
  const emptyCollections = await db.collection.deleteMany({ where: { products: { none: {} } } });
  await db.coupon.deleteMany({ where: { code: "DEMO10", redemptions: { none: {} } } });
  console.log(`Removed ${demoOrders.count} demo orders, ${deleted} demo products (${archived} archived), ${emptyCollections.count} empty collections.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
