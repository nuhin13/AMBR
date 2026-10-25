import { db } from "@/lib/db";
import { requireUser } from "@/modules/auth/session";
import { OrderStatusBadge } from "@/components/account/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { LLink } from "@/components/i18n/llink";
import { getT } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";
import { formatDateL, formatNumber, formatPrice } from "@/i18n/format";

export default async function AccountOverview() {
  const user = await requireUser("/account");
  const { t, locale } = await getT();
  const [orders, addressCount, wishCount] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { placedAt: "desc" }, take: 3, include: { _count: { select: { items: true } } } }),
    db.address.count({ where: { userId: user.id } }),
    db.wishlistItem.count({ where: { userId: user.id } }),
  ]);
  const stats = [
    { href: "/account/orders", label: t.account.orders, value: orders.length ? t.account.viewHistory : t.account.noneYet },
    { href: "/account/addresses", label: t.account.savedAddresses, value: formatNumber(addressCount, locale) },
    { href: "/account/wishlist", label: t.account.wishlist, value: formatNumber(wishCount, locale) },
  ];
  return (
    <div className="space-y-14">
      <div className="grid divide-y divide-burgundy/10 border-y border-burgundy/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((c) => (
          <LLink key={c.href} href={c.href} className="group py-6 sm:px-6 sm:first:pl-0">
            <p className="eyebrow text-burgundy/70">{c.label}</p>
            <p className="mt-2 font-serif text-[26px] text-burgundy transition-colors group-hover:text-burgundy-soft">{c.value}</p>
          </LLink>
        ))}
      </div>
      <section>
        <h2 className="t-h3 mb-5">{t.account.recentOrders}</h2>
        {orders.length === 0 ? (
          <EmptyState title={t.account.noOrders} description={t.account.noOrdersText} action={<ButtonLink href={localePath(locale, "/shop")}>{t.account.startShopping}</ButtonLink>} />
        ) : (
          <ul className="divide-y divide-burgundy/10 border-y border-burgundy/10">
            {orders.map((o) => (
              <li key={o.id}>
                <LLink href={`/account/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 py-5">
                  <span>
                    <span className="font-medium text-burgundy">{o.orderNumber}</span>
                    <span className="block text-[13px] text-muted">{formatDateL(o.placedAt, locale)} · {fmt(o._count.items === 1 ? t.common.items_one : t.common.items_other, { count: formatNumber(o._count.items, locale) })}</span>
                  </span>
                  <span className="flex items-center gap-5"><OrderStatusBadge status={o.status} /><span className="tabular-nums">{formatPrice(o.total, locale)}</span></span>
                </LLink>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
