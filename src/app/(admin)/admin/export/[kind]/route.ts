import { db } from "@/lib/db";
import { requirePermission, type Permission } from "@/modules/auth/rbac";
import { toCsv, csvResponse } from "@/modules/reports/csv";
import { orderWhere } from "@/modules/orders/admin-queries";
import { categoryPerformance, inventoryReport, productPerformance, rangeFrom, salesSeries, variantPerformance, type Bucket } from "@/modules/reports/queries";

const taka = (p: number | null | undefined) => (p === null || p === undefined ? "" : (p / 100).toFixed(2));
const stamp = () => new Date().toISOString().slice(0, 10);

const PERMS: Record<string, Permission> = {
  orders: "orders:manage",
  inventory: "inventory:manage",
  newsletter: "promotions:manage",
  customers: "customers:view",
  sales: "reports:view",
  products: "reports:view",
  variants: "reports:view",
  categories: "reports:view",
};

/** CSV exports. Every kind is permission-checked; filters mirror the on-screen ones. */
export async function GET(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  const perm = PERMS[kind];
  if (!perm) return new Response("Unknown export", { status: 404 });
  await requirePermission(perm);
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const range = rangeFrom(sp, 30);

  switch (kind) {
    case "orders": {
      const rows = await db.order.findMany({ where: orderWhere(sp), orderBy: { placedAt: "desc" }, take: 10000, include: { items: true, shipment: true } });
      return csvResponse(
        `ambr-orders-${stamp()}.csv`,
        toCsv(
          rows.map((o) => ({
            orderNumber: o.orderNumber, placedAt: o.placedAt, status: o.status, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
            customer: o.customerName, phone: o.phone, email: o.email, district: o.districtName, area: o.upazilaName, address: o.addressLine,
            items: o.items.map((i) => `${i.productName} ${i.variantLabel} x${i.quantity}`).join("; "),
            subtotal: taka(o.subtotal), discount: taka(o.discountTotal), delivery: taka(o.shippingFee), total: taka(o.total), coupon: o.couponCode,
            courier: o.shipment?.courier, tracking: o.shipment?.trackingCode,
          })),
          [
            { key: "orderNumber", label: "Order" }, { key: "placedAt", label: "Placed (UTC)" }, { key: "status", label: "Status" }, { key: "paymentMethod", label: "Method" },
            { key: "paymentStatus", label: "Payment" }, { key: "customer", label: "Customer" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" },
            { key: "district", label: "District" }, { key: "area", label: "Area" }, { key: "address", label: "Address" }, { key: "items", label: "Items" },
            { key: "subtotal", label: "Subtotal (BDT)" }, { key: "discount", label: "Discount (BDT)" }, { key: "delivery", label: "Delivery (BDT)" },
            { key: "total", label: "Total (BDT)" }, { key: "coupon", label: "Coupon" }, { key: "courier", label: "Courier" }, { key: "tracking", label: "Tracking" },
          ],
        ),
      );
    }
    case "inventory": {
      const rows = await inventoryReport();
      return csvResponse(
        `ambr-inventory-${stamp()}.csv`,
        toCsv(rows.map((r) => ({ ...r, price: taka(r.price), stockValue: taka(r.stockValue) })), [
          { key: "product", label: "Product" }, { key: "category", label: "Category" }, { key: "size", label: "Size" }, { key: "sku", label: "SKU" },
          { key: "price", label: "Price (BDT)" }, { key: "onHand", label: "On hand" }, { key: "reserved", label: "Reserved" }, { key: "sellable", label: "Sellable" },
          { key: "threshold", label: "Low-stock threshold" }, { key: "state", label: "State" }, { key: "stockValue", label: "Stock value at retail (BDT)" },
          { key: "productStatus", label: "Product status" }, { key: "variantStatus", label: "Size status" },
        ]),
      );
    }
    case "newsletter": {
      const rows = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
      return csvResponse(`ambr-newsletter-${stamp()}.csv`, toCsv(rows, [{ key: "email", label: "Email" }, { key: "status", label: "Status" }, { key: "source", label: "Source" }, { key: "createdAt", label: "Subscribed (UTC)" }]));
    }
    case "customers": {
      const users = await db.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" }, include: { profile: true } });
      const spend = await db.order.groupBy({ by: ["userId"], where: { userId: { in: users.map((u) => u.id) }, status: "DELIVERED" }, _sum: { total: true }, _count: { _all: true } });
      const m = new Map(spend.map((s) => [s.userId, s]));
      return csvResponse(
        `ambr-customers-${stamp()}.csv`,
        toCsv(
          users.map((u) => ({ name: u.name, email: u.email, phone: u.phone, status: u.status, marketing: u.profile?.marketingOptIn ? "yes" : "no", joined: u.createdAt, delivered: m.get(u.id)?._count._all ?? 0, spent: taka(m.get(u.id)?._sum.total ?? 0) })),
          [{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "status", label: "Status" }, { key: "marketing", label: "Marketing opt-in" }, { key: "joined", label: "Joined (UTC)" }, { key: "delivered", label: "Delivered orders" }, { key: "spent", label: "Spent (BDT)" }],
        ),
      );
    }
    case "sales": {
      const bucket = (["day", "week", "month"].includes(sp.bucket) ? sp.bucket : "day") as Bucket;
      const rows = await salesSeries(range.from, range.to, bucket);
      return csvResponse(`ambr-sales-${bucket}-${range.fromStr}-to-${range.toStr}.csv`, toCsv(rows.map((r) => ({ ...r, revenue: taka(r.revenue) })), [{ key: "period", label: "Period start" }, { key: "orders", label: "Orders placed (excl. cancelled)" }, { key: "paidOrders", label: "Paid orders" }, { key: "revenue", label: "Revenue (BDT)" }]));
    }
    case "products": {
      const rows = await productPerformance(range.from, range.to, 1000);
      return csvResponse(`ambr-products-${range.fromStr}-to-${range.toStr}.csv`, toCsv(rows.map((r) => ({ ...r, revenue: taka(r.revenue) })), [{ key: "productName", label: "Product" }, { key: "orders", label: "Orders" }, { key: "units", label: "Units" }, { key: "revenue", label: "Revenue (BDT)" }]));
    }
    case "variants": {
      const rows = await variantPerformance(range.from, range.to, 2000);
      return csvResponse(`ambr-sizes-${range.fromStr}-to-${range.toStr}.csv`, toCsv(rows.map((r) => ({ ...r, revenue: taka(r.revenue) })), [{ key: "productName", label: "Product" }, { key: "variantLabel", label: "Size" }, { key: "sku", label: "SKU" }, { key: "units", label: "Units" }, { key: "revenue", label: "Revenue (BDT)" }]));
    }
    case "categories": {
      const rows = await categoryPerformance(range.from, range.to);
      return csvResponse(`ambr-categories-${range.fromStr}-to-${range.toStr}.csv`, toCsv(rows.map((r) => ({ ...r, revenue: taka(r.revenue) })), [{ key: "category", label: "Category" }, { key: "orders", label: "Orders" }, { key: "units", label: "Units" }, { key: "revenue", label: "Revenue (BDT)" }]));
    }
  }
  return new Response("Unknown export", { status: 404 });
}
