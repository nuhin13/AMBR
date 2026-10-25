import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { setSubscriberStatusAction } from "@/modules/content/admin-actions";
import { formatDate } from "@/lib/utils";
import { PageHeader, Table, Th, Td, EmptyRow, StatCard } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-form";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  await requirePermission("promotions:manage");
  const subs = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  const active = subs.filter((s) => s.status === "SUBSCRIBED").length;
  return (
    <>
      <PageHeader title="Newsletter" description="Export subscribers to your email tool (Mailchimp, Brevo…). Only email people who are subscribed." actions={<ButtonLink href="/admin/export/newsletter" variant="secondary" size="sm" prefetch={false}>Export CSV</ButtonLink>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:w-1/2"><StatCard label="Subscribed" value={active} /><StatCard label="Unsubscribed" value={subs.length - active} /></div>
      <Table>
        <thead><tr><Th>Email</Th><Th>Source</Th><Th>Since</Th><Th>Status</Th><Th /></tr></thead>
        <tbody>
          {subs.length === 0 && <EmptyRow colSpan={5}>No subscribers yet.</EmptyRow>}
          {subs.map((s) => (
            <tr key={s.id}>
              <Td>{s.email}</Td>
              <Td className="text-[12.5px] text-muted">{s.source ?? "—"}</Td>
              <Td className="text-[12.5px]">{formatDate(s.createdAt)}</Td>
              <Td><Badge tone={s.status === "SUBSCRIBED" ? "success" : "outline"}>{s.status.toLowerCase()}</Badge></Td>
              <Td align="right"><ActionButton action={setSubscriberStatusAction} fields={{ id: s.id, status: s.status === "SUBSCRIBED" ? "UNSUBSCRIBED" : "SUBSCRIBED" }} variant="ghost">{s.status === "SUBSCRIBED" ? "Unsubscribe" : "Resubscribe"}</ActionButton></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
