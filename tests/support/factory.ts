import { PrismaClient } from "@prisma/client";

export const testDb = new PrismaClient();

export async function resetDb() {
  const tables = await testDb.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await testDb.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

let n = 0;
export async function makeVariant(opts: { onHand: number; price?: number }) {
  n++;
  const category = await testDb.category.upsert({ where: { slug: "perfumes" }, create: { slug: "perfumes", name: "Perfumes", status: "ACTIVE", type: "PERFUME" }, update: {} });
  const product = await testDb.product.create({
    data: {
      slug: `p-${n}-${Date.now()}`,
      name: `Product ${n}`,
      categoryId: category.id,
      shortDescription: "x",
      description: "x",
      productType: "Perfume",
      status: "PUBLISHED",
      variants: { create: { sku: `SKU-${n}-${Date.now()}`, sizeMl: 10, label: "10 ml", price: opts.price ?? 35000, inventory: { create: { onHand: opts.onHand } } } },
    },
    include: { variants: true },
  });
  return { product, variant: product.variants[0] };
}

export async function makeOrder(variantId: string, productId: string, qty: number, extra: Partial<{ paymentMethod: "COD" | "BKASH"; total: number; paymentStatus: "UNPAID" | "PENDING" }> = {}) {
  n++;
  return testDb.order.create({
    data: {
      orderNumber: `AMB-TEST-${n}-${Date.now() % 100000}`,
      guestAccessToken: `tok-${n}-${Date.now()}`,
      idempotencyKey: `idem-${n}-${Date.now()}`,
      paymentMethod: extra.paymentMethod ?? "COD",
      paymentStatus: extra.paymentStatus ?? "UNPAID",
      customerName: "Test",
      phone: "+8801712345678",
      districtName: "Dhaka",
      addressLine: "House 1",
      shippingZoneName: "Inside Dhaka",
      subtotal: 35000 * qty,
      shippingFee: 7000,
      total: extra.total ?? 35000 * qty + 7000,
      items: { create: { variantId, productId, productName: "P", productSlug: "p", variantLabel: "10 ml", sku: "S", unitPrice: 35000, quantity: qty, lineTotal: 35000 * qty } },
    },
  });
}
