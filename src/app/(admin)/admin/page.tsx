import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { formatBDT } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { requirePermission, can } from "@/modules/auth/rbac";
import { releaseExpiredReservations } from "@/modules/orders/service";
import { getSettings } from "@/modules/content/settings";
import { paymentMethods } from "@/modules/payments/availability";
import { kpis, salesSeries, bestSellersSince, lowStock, rangeFrom } from "@/modules/reports/queries";
import { PAYMENT_METHOD_LABEL } from "@/modules/orders/status";
import { Card, PageHeader, StatCard, Table, Th, Td, OrderStatusBadge, PaymentStatusBadge, EmptyRow } from "@/components/admin/ui";
import { TrendChart, RankBars } from "@/components/admin/charts";
import { ButtonLink } from "@/components/ui/button";
import { listTranslationItems } from "@/modules/translations/admin-queries";

export const metadata = { title: "Dashboard" };

const PLACEHOLDER_FEES: Record<string, number> = { "inside-dhaka": 7000, "dhaka-suburbs": 10000, "outside-dhaka": 13000 };

export default async function Dashboard() {
  const user = await requirePermission("dashboard:view");
  await releaseExpiredReservations().catch(() => 0);
  const { from: since, to: now } = rangeFrom({}, 30);
  const [k, series, best, low, recent, checklist] = await Promise.all([
    kpis(),
    salesSeries(since, now, "day"),
    bestSellersSince(since, 6),
    lowStock(8),
    db.order.findMany({ orderBy: { placedAt: "desc" }, take: 8 }),
    launchChecklist(),
  ]);
  const last30Revenue = series.reduce((s, d) => s + d.revenue, 0);
  const last30Orders = series.reduce((s, d) => s + d.orders, 0);
  const canOrders = can(user.role, "orders:manage");

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="A summary of your store. Revenue counts paid orders only — cash-on-delivery orders count once delivered."
        actions={canOrders ? <ButtonLink href="/admin/orders?status=PENDING" size="sm">Pending orders ({k.pending})</ButtonLink> : undefined}
      />

      {checklist.some((c) => !c.done) && can(user.role, "settings:manage") && (
        <Card title="Launch checklist" className="mb-6">
          <ul className="grid gap-2 md:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5 text-[13.5px]">
                {c.done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Done" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" aria-label="To do" />}
                <span className={c.done ? "text-muted line-through decoration-beige" : undefined}>
                  {c.label}
                  {!c.done && c.href && <Link href={c.href} className="ml-2 text-burgundy underline underline-offset-4">Fix</Link>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard label="Total sales" value={formatBDT(k.revenue)} hint={`${k.paidOrders} paid orders`} href="/admin/reports" />
        <StatCard label="Total orders" value={k.orders} hint={`${k.inProgress} in progress`} href="/admin/orders" />
        <StatCard label="Pending" value={k.pending} hint="Awaiting confirmation" href="/admin/orders?status=PENDING" />
        <StatCard label="Customers" value={k.customers} hint="Registered accounts" href="/admin/customers" />
        <StatCard label="Completed" value={k.completed} hint="Delivered" href="/admin/orders?status=DELIVERED" />
        <StatCard label="Cancelled" value={k.cancelled} hint={k.returned ? `${k.returned} returned` : undefined} href="/admin/orders?status=CANCELLED" />
        <StatCard label="Revenue · 30 days" value={formatBDT(last30Revenue)} />
        <StatCard label="Orders · 30 days" value={last30Orders} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Revenue · last 30 days">
          <TrendChart kind="money" data={series.map((d) => ({ label: d.label, value: d.revenue }))} />
        </Card>
        <Card title="Orders · last 30 days">
          <TrendChart kind="count" data={series.map((d) => ({ label: d.label, value: d.orders }))} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-[12px] text-burgundy underline underline-offset-4">All orders</Link>} padded={false}>
          <Table className="border-0">
            <thead>
              <tr><Th>Order</Th><Th>Customer</Th><Th>Status</Th><Th>Payment</Th><Th align="right">Total</Th></tr>
            </thead>
            <tbody>
              {recent.length === 0 && <EmptyRow colSpan={5}>No orders yet.</EmptyRow>}
              {recent.map((o) => (
                <tr key={o.id} className="hover:bg-cream-light">
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-burgundy hover:underline">{o.orderNumber}</Link>
                    <div className="text-[11.5px] text-muted">{formatDateTime(o.placedAt)}</div>
                  </Td>
                  <Td>{o.customerName}</Td>
                  <Td><OrderStatusBadge status={o.status} /></Td>
                  <Td><span className="mr-1.5 text-[12px] text-muted">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</span><PaymentStatusBadge status={o.paymentStatus} /></Td>
                  <Td align="right">{formatBDT(o.total)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <div className="space-y-6">
          <Card title="Best sellers · 30 days">
            <RankBars data={best.map((b) => ({ label: `${b.productName} (${b.units})`, value: b.revenue }))} />
          </Card>
          <Card title="Low stock" actions={<Link href="/admin/inventory?state=low" className="text-[12px] text-burgundy underline underline-offset-4">Inventory</Link>}>
            {low.length === 0 ? (
              <p className="text-[13px] text-muted">All published sizes are above their low-stock threshold.</p>
            ) : (
              <ul className="divide-y divide-beige text-[13.5px]">
                {low.map((v) => (
                  <li key={v.variantId} className="flex items-center justify-between py-2">
                    <span>{v.product} · {v.size}</span>
                    <span className={v.sellable === 0 ? "font-medium text-error" : "font-medium text-burgundy"}>{v.sellable === 0 ? "Out of stock" : `${v.sellable} left`}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

async function launchChecklist() {
  const [{ store, social }, methods, zones, demo, pages, noPhoto, translations, bnPages, reviewedBn] = await Promise.all([
    getSettings(),
    paymentMethods(),
    db.shippingZone.findMany(),
    db.product.count({ where: { isDemo: true } }),
    db.contentPage.findMany({ select: { slug: true, createdAt: true, updatedAt: true } }),
    db.product.count({ where: { status: "PUBLISHED", isDemo: false, images: { none: {} } } }),
    listTranslationItems(),
    db.contentPageTranslation.findMany({ where: { locale: "bn", status: "PUBLISHED" }, select: { pageId: true } }),
    db.auditLog.findMany({ where: { action: { startsWith: "translation.bn." }, entityType: "page" }, select: { entityId: true }, distinct: ["entityId"] }),
  ]);
  const bnDrafts = translations.filter((t) => t.bnStatus === "DRAFT").length;
  const bnMissing = translations.filter((t) => t.bnStatus === "MISSING").length;
  // Seeded Bangla pages count as reviewed once staff have saved them at least once in the admin.
  const reviewed = new Set(reviewedBn.map((r) => r.entityId));
  const bnPagesUnreviewed = bnPages.filter((p) => !reviewed.has(p.pageId)).length;
  const placeholderFees = zones.some((z) => PLACEHOLDER_FEES[z.slug] !== undefined && z.fee === PLACEHOLDER_FEES[z.slug] && z.updatedAt.getTime() - z.createdAt.getTime() < 2000);
  const policiesUntouched = pages.filter((p) => p.updatedAt.getTime() - p.createdAt.getTime() < 2000).length;
  return [
    { label: "Add your support phone number", done: Boolean(store.phone), href: "/admin/settings" },
    { label: "Add your WhatsApp number", done: Boolean(store.whatsapp), href: "/admin/settings" },
    { label: "Add your support email", done: Boolean(store.email), href: "/admin/settings" },
    { label: "Add Facebook / Instagram links", done: Boolean(social.facebook || social.instagram), href: "/admin/settings" },
    { label: "Add legal business name & trade licence", done: Boolean(store.legalName && store.tradeLicense), href: "/admin/settings" },
    { label: "Set your real delivery charges (placeholder fees are still active)", done: !placeholderFees, href: "/admin/shipping" },
    { label: "Enable an online payment method (bKash, Nagad or card)", done: methods.some((m) => m.method !== "COD" && m.available), href: "/admin/payments" },
    { label: `Review and edit About & policy pages (${policiesUntouched} not yet edited)`, done: policiesUntouched === 0, href: "/admin/content/pages" },
    { label: `Remove demo products (${demo} demo products are live)`, done: demo === 0, href: "/admin/products?demo=1" },
    { label: `Upload photos for real products (${noPhoto} without photos)`, done: noPhoto === 0, href: "/admin/products" },
    { label: `Review Bangla translations (${bnDrafts} drafts, ${bnMissing} missing)`, done: bnDrafts === 0 && bnMissing === 0, href: bnMissing ? "/admin/content/translations?status=MISSING" : "/admin/content/translations?status=DRAFT" },
    { label: `Review starter content in both languages — seeded Bangla content is published, please proofread (${bnPagesUnreviewed} Bangla pages not yet reviewed)`, done: bnPagesUnreviewed === 0 && policiesUntouched === 0, href: "/admin/content/pages" },
    { label: "Change the default owner password (Account → Profile)", done: false, href: "/en/account/profile" },
  ];
}
