import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, can } from "@/modules/auth/rbac";
import { getCustomer } from "@/modules/customers/admin-queries";
import { saveCustomerNotesAction, setCustomerStatusAction } from "@/modules/customers/admin-actions";
import { formatBDT } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatBDPhone } from "@/lib/phone";
import { PageHeader, Card, StatCard, Table, Th, Td, EmptyRow, DefinitionList, OrderStatusBadge } from "@/components/admin/ui";
import { ActionForm, ActionButton, SubmitButton } from "@/components/admin/action-form";
import { Textarea } from "@/components/ui/field";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission("customers:view");
  const { id } = await params;
  const data = await getCustomer(id);
  if (!data || data.user.role !== "CUSTOMER") notFound();
  const { user, guestOrders, spent, deliveredCount } = data;
  const orders = [...user.orders, ...guestOrders].sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());
  return (
    <>
      <PageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={user.name}
        description={`Customer since ${formatDate(user.createdAt)}${user.lastLoginAt ? ` · last sign-in ${formatDateTime(user.lastLoginAt)}` : ""}`}
        actions={can(me.role, "customers:manage") ? (
          user.status === "ACTIVE"
            ? <ActionButton action={setCustomerStatusAction} fields={{ userId: user.id, status: "DISABLED" }} variant="ghost" className="text-error" confirm="Disable this account? They will be signed out and unable to sign in.">Disable account</ActionButton>
            : <ActionButton action={setCustomerStatusAction} fields={{ userId: user.id, status: "ACTIVE" }} variant="secondary">Re-enable account</ActionButton>
        ) : undefined}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Delivered" value={deliveredCount} />
        <StatCard label="Total spent" value={formatBDT(spent)} hint="Delivered orders" />
        <StatCard label="Reviews · wishlist" value={`${user._count.reviews} · ${user._count.wishlist}`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Order history" padded={false}>
          <Table className="border-0">
            <thead><tr><Th>Order</Th><Th>Date</Th><Th>Status</Th><Th align="right">Total</Th></tr></thead>
            <tbody>
              {orders.length === 0 && <EmptyRow colSpan={4}>No orders yet.</EmptyRow>}
              {orders.map((o) => (
                <tr key={o.id}>
                  <Td><Link href={`/admin/orders/${o.id}`} className="text-burgundy hover:underline">{o.orderNumber}</Link>{!o.userId && <span className="ml-1 text-[11px] text-muted">(guest, same phone)</span>}</Td>
                  <Td className="text-[12.5px]">{formatDate(o.placedAt)}</Td>
                  <Td><OrderStatusBadge status={o.status} /></Td>
                  <Td align="right">{formatBDT(o.total)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <div className="space-y-6">
          <Card title="Contact">
            <DefinitionList items={[["Email", user.email ?? "—"], ["Phone", user.phone ? formatBDPhone(user.phone) : "—"], ["Marketing", user.profile?.marketingOptIn ? "Opted in" : "Not opted in"], ["Status", user.status.toLowerCase()]]} />
          </Card>
          <Card title="Saved addresses">
            {user.addresses.length === 0 ? <p className="text-[13px] text-muted">None saved.</p> : (
              <ul className="space-y-3 text-[13.5px]">
                {user.addresses.map((a) => (
                  <li key={a.id}><span className="font-medium">{a.label}{a.isDefault ? " (default)" : ""}</span> — {a.recipientName}, {formatBDPhone(a.phone)}<br /><span className="text-muted">{a.line}, {a.upazila?.name ? `${a.upazila.name}, ` : ""}{a.district.name}</span></li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Internal notes">
            <ActionForm action={saveCustomerNotesAction} className="space-y-3">
              <input type="hidden" name="userId" value={user.id} />
              <Textarea name="adminNotes" rows={4} defaultValue={user.profile?.adminNotes ?? ""} placeholder="Only visible to staff, e.g. preferences, delivery notes" />
              <SubmitButton size="sm" variant="secondary">Save notes</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
