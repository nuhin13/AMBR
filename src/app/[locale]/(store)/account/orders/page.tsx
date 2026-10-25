import { db } from "@/lib/db";
import { requireUser } from "@/modules/auth/session";
import { OrderStatusBadge } from "@/components/account/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { LLink } from "@/components/i18n/llink";
import { getT } from "@/i18n/server";
import { localePath } from "@/i18n/config";
import { formatDateL, formatPrice } from "@/i18n/format";

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const { t, locale } = await getT();
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { placedAt: "desc" }, include: { items: { select: { productName: true, quantity: true } } } });
  if (orders.length === 0) return <EmptyState title={t.account.noOrders} description={t.account.noOrdersText} action={<ButtonLink href={localePath(locale, "/shop")}>{t.account.startShopping}</ButtonLink>} />;
  return (
    <div>
      <h2 className="t-h3 mb-5">{t.account.orderHistory}</h2>
      <ul className="divide-y divide-burgundy/10 border-y border-burgundy/10">
        {orders.map((o) => (
          <li key={o.id}>
            <LLink href={`/account/orders/${o.orderNumber}`} className="grid gap-2 py-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <span>
                <span className="font-medium text-burgundy">{o.orderNumber}</span> <span className="text-[13px] text-muted">· {formatDateL(o.placedAt, locale)}</span>
                <span className="mt-1 block truncate text-[13.5px] text-muted">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</span>
              </span>
              <span className="flex items-center gap-5"><OrderStatusBadge status={o.status} /><span className="tabular-nums">{formatPrice(o.total, locale)}</span></span>
            </LLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
