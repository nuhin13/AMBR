import Link from "next/link";
import { db } from "@/lib/db";
import { formatBDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { requireUser } from "@/modules/auth/session";
import { OrderStatusBadge } from "@/components/account/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { placedAt: "desc" }, include: { items: { select: { productName: true, quantity: true } } } });
  if (orders.length === 0) return <EmptyState title="No orders yet" description="Orders you place while signed in — or with your account's phone number — appear here." action={<ButtonLink href="/shop">Start shopping</ButtonLink>} />;
  return (
    <div>
      <h2 className="mb-4 text-[24px]">Order history</h2>
      <ul className="divide-y divide-beige border-y border-beige">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/account/orders/${o.orderNumber}`} className="grid gap-2 py-5 hover:bg-cream-light sm:grid-cols-[1fr_auto] sm:items-center">
              <span>
                <span className="font-medium text-burgundy">{o.orderNumber}</span> <span className="text-[13px] text-muted">· {formatDate(o.placedAt)}</span>
                <span className="mt-1 block truncate text-[13.5px] text-muted">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</span>
              </span>
              <span className="flex items-center gap-4"><OrderStatusBadge status={o.status} /><span className="tabular-nums">{formatBDT(o.total)}</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
