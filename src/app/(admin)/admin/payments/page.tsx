import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { requirePermission } from "@/modules/auth/rbac";
import { getSettings } from "@/modules/content/settings";
import { paymentMethods } from "@/modules/payments/availability";
import { PAYMENT_METHOD_LABEL } from "@/modules/orders/status";
import { formatBDT } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { PageHeader, Card, Table, Th, Td, EmptyRow, PaymentStatusBadge } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-forms";
import { Checkbox, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Payments" };

const KEY: Record<string, "cod" | "bkash" | "nagad" | "card"> = { COD: "cod", BKASH: "bkash", NAGAD: "nagad", CARD: "card" };
const ENV_HINT: Record<string, string> = {
  COD: "No credentials needed.",
  BKASH: "BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD",
  NAGAD: "NAGAD_MERCHANT_ID, NAGAD_MERCHANT_PRIVATE_KEY, NAGAD_PG_PUBLIC_KEY",
  CARD: "SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD",
};

export default async function PaymentsPage() {
  await requirePermission("settings:manage");
  const [methods, { payments }, recent] = await Promise.all([
    paymentMethods(),
    getSettings(),
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { order: { select: { id: true, orderNumber: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Payments" description={`Gateway mode: ${env.PAYMENT_MODE === "live" ? "LIVE" : "Sandbox (test)"}. A method appears at checkout only when it is enabled here AND its credentials are set in the server environment. Secret keys are never shown or stored in the admin.`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card title="Payment methods">
          <SettingsForm group="payments" booleans={["cod", "bkash", "nagad", "card"]}>
            <ul className="divide-y divide-beige">
              {methods.map((m) => (
                <li key={m.method} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Checkbox name={KEY[m.method]} defaultChecked={m.enabled} label={<span className="font-medium">{PAYMENT_METHOD_LABEL[m.method]}{m.method === "CARD" && " (SSLCommerz)"}</span>} />
                    <p className="ml-7 text-[12px] text-muted">{m.configured ? "Credentials configured" : `Needs: ${ENV_HINT[m.method]}`}</p>
                  </div>
                  <Badge tone={m.available ? "success" : m.enabled ? "gold" : "outline"}>{m.available ? "Live at checkout" : m.enabled ? "Enabled · not configured" : "Off"}</Badge>
                </li>
              ))}
            </ul>
            <Textarea name="codNote" label="Cash-on-delivery note shown at checkout (English)" rows={2} defaultValue={payments.codNote} />
            <Textarea name="codNoteBn" label="Cash-on-delivery note (বাংলা)" rows={2} defaultValue={payments.codNoteBn} lang="bn" style={{ fontFamily: "var(--font-sans-bn), var(--font-montserrat), sans-serif" }} />
          </SettingsForm>
        </Card>
        <Card title="Recent payment attempts" padded={false}>
          <Table className="border-0">
            <thead><tr><Th>Order</Th><Th>Provider</Th><Th>Status</Th><Th align="right">Amount</Th><Th>When</Th></tr></thead>
            <tbody>
              {recent.length === 0 && <EmptyRow colSpan={5}>No payments yet.</EmptyRow>}
              {recent.map((p) => (
                <tr key={p.id}>
                  <Td><Link href={`/admin/orders/${p.order.id}`} className="text-burgundy hover:underline">{p.order.orderNumber}</Link></Td>
                  <Td>{p.provider}</Td>
                  <Td><PaymentStatusBadge status={p.status} /></Td>
                  <Td align="right">{formatBDT(p.amount)}</Td>
                  <Td className="text-[12px] text-muted">{formatDateTime(p.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}
