import Link from "next/link";
import { db } from "@/lib/db";
import { formatBDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { requireUser } from "@/modules/auth/session";
import { OrderStatusBadge } from "@/components/account/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default async function AccountOverview() {
  const user = await requireUser("/account");
  const [orders, addressCount, wishCount] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { placedAt: "desc" }, take: 3, include: { _count: { select: { items: true } } } }),
    db.address.count({ where: { userId: user.id } }),
    db.wishlistItem.count({ where: { userId: user.id } }),
  ]);
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/account/orders", label: "Orders", value: orders.length ? "View history" : "None yet" },
          { href: "/account/addresses", label: "Saved addresses", value: String(addressCount) },
          { href: "/account/wishlist", label: "Wishlist", value: String(wishCount) },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="border border-beige bg-cream-light p-5 hover:border-burgundy">
            <p className="eyebrow text-burgundy/80">{c.label}</p>
            <p className="mt-2 font-serif text-[24px] text-burgundy">{c.value}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="mb-4 text-[24px]">Recent orders</h2>
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="When you place an order it will appear here." action={<ButtonLink href="/shop">Start shopping</ButtonLink>} />
        ) : (
          <ul className="divide-y divide-beige border-y border-beige">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-cream-light">
                  <span>
                    <span className="font-medium text-burgundy">{o.orderNumber}</span>
                    <span className="block text-[13px] text-muted">{formatDate(o.placedAt)} · {o._count.items} item{o._count.items === 1 ? "" : "s"}</span>
                  </span>
                  <span className="flex items-center gap-4"><OrderStatusBadge status={o.status} /><span className="tabular-nums">{formatBDT(o.total)}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
