import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Revenue = orders whose payment is PAID and that were not cancelled/returned.
 * COD orders become PAID on delivery, online orders on gateway confirmation.
 * All day/week/month buckets are Asia/Dhaka.
 */
const REVENUE_WHERE = Prisma.sql`"paymentStatus" = 'PAID' AND "status" NOT IN ('CANCELLED','RETURNED')`;
const LOCAL = Prisma.sql`(("placedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Dhaka')`;

export type Bucket = "day" | "week" | "month";

export async function salesSeries(from: Date, to: Date, bucket: Bucket = "day") {
  const unit = Prisma.raw(`'${bucket}'`);
  const rows = await db.$queryRaw<{ period: Date; orders: bigint; revenue: bigint; paidOrders: bigint }[]>`
    SELECT date_trunc(${unit}, ${LOCAL}) AS period,
           COUNT(*) FILTER (WHERE "status" <> 'CANCELLED') AS orders,
           COALESCE(SUM("total") FILTER (WHERE ${REVENUE_WHERE}), 0) AS revenue,
           COUNT(*) FILTER (WHERE ${REVENUE_WHERE}) AS "paidOrders"
    FROM "Order"
    WHERE "placedAt" >= ${from} AND "placedAt" <= ${to}
    GROUP BY 1 ORDER BY 1`;
  const map = new Map(rows.map((r) => [keyOf(r.period), r]));
  // Fill empty periods so charts show true gaps as zero.
  const out: { period: string; label: string; orders: number; revenue: number; paidOrders: number }[] = [];
  const cursor = startOf(toDhaka(from), bucket);
  const end = toDhaka(to);
  let guard = 0;
  while (cursor <= end && guard++ < 800) {
    const k = keyOf(cursor);
    const r = map.get(k);
    out.push({ period: k, label: labelOf(cursor, bucket), orders: Number(r?.orders ?? 0), revenue: Number(r?.revenue ?? 0), paidOrders: Number(r?.paidOrders ?? 0) });
    if (bucket === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (bucket === "week") cursor.setUTCDate(cursor.getUTCDate() + 7);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

// date_trunc returns a timestamp without zone representing Dhaka wall-clock; Prisma gives it back as a UTC Date with the same fields.
const keyOf = (d: Date) => d.toISOString().slice(0, 10);
const toDhaka = (d: Date) => new Date(d.getTime() + 6 * 3600_000);
function startOf(d: Date, bucket: Bucket) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  if (bucket === "week") {
    const dow = (x.getUTCDay() + 6) % 7; // Monday start, like Postgres
    x.setUTCDate(x.getUTCDate() - dow);
  }
  if (bucket === "month") x.setUTCDate(1);
  return x;
}
function labelOf(d: Date, bucket: Bucket) {
  const opts: Intl.DateTimeFormatOptions = bucket === "month" ? { month: "short", year: "numeric", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" };
  return (bucket === "week" ? "Wk of " : "") + new Intl.DateTimeFormat("en-GB", opts).format(d);
}

export async function kpis() {
  const [revenue, totals, customers, byStatus] = await Promise.all([
    db.$queryRaw<{ revenue: bigint; count: bigint }[]>`SELECT COALESCE(SUM("total"),0) AS revenue, COUNT(*) AS count FROM "Order" WHERE ${REVENUE_WHERE}`,
    db.order.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const s = Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) as Record<string, number>;
  return {
    revenue: Number(revenue[0]?.revenue ?? 0),
    paidOrders: Number(revenue[0]?.count ?? 0),
    orders: totals,
    pending: s.PENDING ?? 0,
    inProgress: (s.CONFIRMED ?? 0) + (s.PROCESSING ?? 0) + (s.SHIPPED ?? 0),
    completed: s.DELIVERED ?? 0,
    cancelled: s.CANCELLED ?? 0,
    returned: s.RETURNED ?? 0,
    customers,
  };
}

export async function productPerformance(from: Date, to: Date, limit = 50) {
  const rows = await db.$queryRaw<{ productId: string; productName: string; units: bigint; revenue: bigint; orders: bigint }[]>`
    SELECT oi."productId", MAX(oi."productName") AS "productName", SUM(oi."quantity") AS units, SUM(oi."lineTotal") AS revenue, COUNT(DISTINCT o."id") AS orders
    FROM "OrderItem" oi JOIN "Order" o ON o."id" = oi."orderId"
    WHERE o."status" NOT IN ('CANCELLED','RETURNED') AND o."placedAt" >= ${from} AND o."placedAt" <= ${to}
    GROUP BY oi."productId" ORDER BY revenue DESC LIMIT ${limit}`;
  return rows.map((r) => ({ productId: r.productId, productName: r.productName, units: Number(r.units), revenue: Number(r.revenue), orders: Number(r.orders) }));
}

export async function variantPerformance(from: Date, to: Date, limit = 100) {
  const rows = await db.$queryRaw<{ sku: string; productName: string; variantLabel: string; units: bigint; revenue: bigint }[]>`
    SELECT oi."sku", MAX(oi."productName") AS "productName", MAX(oi."variantLabel") AS "variantLabel", SUM(oi."quantity") AS units, SUM(oi."lineTotal") AS revenue
    FROM "OrderItem" oi JOIN "Order" o ON o."id" = oi."orderId"
    WHERE o."status" NOT IN ('CANCELLED','RETURNED') AND o."placedAt" >= ${from} AND o."placedAt" <= ${to}
    GROUP BY oi."sku" ORDER BY units DESC LIMIT ${limit}`;
  return rows.map((r) => ({ ...r, units: Number(r.units), revenue: Number(r.revenue) }));
}

export async function categoryPerformance(from: Date, to: Date) {
  const rows = await db.$queryRaw<{ category: string; units: bigint; revenue: bigint; orders: bigint }[]>`
    SELECT c."name" AS category, SUM(oi."quantity") AS units, SUM(oi."lineTotal") AS revenue, COUNT(DISTINCT o."id") AS orders
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."orderId"
    JOIN "Product" p ON p."id" = oi."productId"
    JOIN "Category" c ON c."id" = p."categoryId"
    WHERE o."status" NOT IN ('CANCELLED','RETURNED') AND o."placedAt" >= ${from} AND o."placedAt" <= ${to}
    GROUP BY c."name" ORDER BY revenue DESC`;
  return rows.map((r) => ({ category: r.category, units: Number(r.units), revenue: Number(r.revenue), orders: Number(r.orders) }));
}

export async function orderBreakdown(from: Date, to: Date) {
  const [byStatus, byMethod, byZone] = await Promise.all([
    db.order.groupBy({ by: ["status"], where: { placedAt: { gte: from, lte: to } }, _count: { _all: true }, _sum: { total: true } }),
    db.order.groupBy({ by: ["paymentMethod"], where: { placedAt: { gte: from, lte: to } }, _count: { _all: true }, _sum: { total: true } }),
    db.order.groupBy({ by: ["shippingZoneName"], where: { placedAt: { gte: from, lte: to } }, _count: { _all: true }, _sum: { total: true, shippingFee: true } }),
  ]);
  return { byStatus, byMethod, byZone };
}

export async function inventoryReport() {
  const variants = await db.productVariant.findMany({
    orderBy: [{ product: { name: "asc" } }, { sizeMl: "asc" }],
    include: { inventory: true, product: { select: { name: true, status: true, isDemo: true, category: { select: { name: true } } } } },
  });
  return variants.map((v) => {
    const onHand = v.inventory?.onHand ?? 0;
    const reserved = v.inventory?.reserved ?? 0;
    const threshold = v.inventory?.lowStockThreshold ?? 5;
    const sellable = Math.max(0, onHand - reserved);
    return {
      variantId: v.id,
      productId: v.productId,
      product: v.product.name,
      category: v.product.category.name,
      productStatus: v.product.status,
      isDemo: v.product.isDemo,
      variantStatus: v.status,
      sku: v.sku,
      size: v.label,
      price: v.price,
      onHand,
      reserved,
      sellable,
      threshold,
      stockValue: onHand * v.price,
      state: sellable === 0 ? "Out of stock" : sellable <= threshold ? "Low" : "OK",
    };
  });
}

export async function bestSellersSince(from: Date, limit = 5) {
  return productPerformance(from, new Date(), limit);
}

export async function lowStock(limit = 8) {
  const rows = await inventoryReport();
  return rows.filter((r) => r.variantStatus === "ACTIVE" && r.productStatus === "PUBLISHED" && r.state !== "OK").sort((a, b) => a.sellable - b.sellable).slice(0, limit);
}

/** Parses a ?from=&to= range (Dhaka dates); defaults to the last `days` days. */
export function rangeFrom(params: { from?: string; to?: string }, days = 30) {
  const toD = params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? new Date(`${params.to}T23:59:59.999+06:00`) : new Date();
  const fromD = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? new Date(`${params.from}T00:00:00+06:00`) : new Date(toD.getTime() - (days - 1) * 86400_000);
  if (!params.from) fromD.setTime(new Date(`${new Date(fromD.getTime() + 6 * 3600_000).toISOString().slice(0, 10)}T00:00:00+06:00`).getTime());
  return { from: fromD, to: toD, fromStr: new Date(fromD.getTime() + 6 * 3600_000).toISOString().slice(0, 10), toStr: new Date(toD.getTime() + 6 * 3600_000).toISOString().slice(0, 10) };
}
