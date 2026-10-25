import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { markMessageAction } from "@/modules/content/admin-actions";
import { formatDateTime } from "@/lib/utils";
import { formatBDPhone } from "@/lib/phone";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requirePermission("customers:view");
  const messages = await db.contactMessage.findMany({ orderBy: [{ isRead: "asc" }, { createdAt: "desc" }], take: 200 });
  return (
    <>
      <PageHeader title="Messages" description="Messages sent through the Contact page. Reply by email, phone or WhatsApp." />
      {messages.length === 0 ? <Card><EmptyState title="No messages yet" /></Card> : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className={m.isRead ? "opacity-75" : undefined}>
              <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium">{m.name}{!m.isRead && <Badge tone="burgundy">New</Badge>}<span className="text-[12px] font-normal text-muted">{formatDateTime(m.createdAt)}</span></p>
                  {m.subject && <p className="mt-1 text-[13.5px] font-medium text-burgundy">{m.subject}</p>}
                  <p className="mt-1 whitespace-pre-line text-[14px]">{m.message}</p>
                  <p className="mt-2 flex flex-wrap gap-3 text-[13px]">
                    {m.email && <a href={`mailto:${m.email}`} className="text-burgundy underline">{m.email}</a>}
                    {m.phone && <a href={`tel:${m.phone}`} className="text-burgundy underline">{formatBDPhone(m.phone)}</a>}
                    {m.phone && <a href={`https://wa.me/${m.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-burgundy underline">WhatsApp</a>}
                  </p>
                </div>
                <ActionButton action={markMessageAction} fields={{ id: m.id, read: m.isRead ? "false" : "true" }} variant="ghost">{m.isRead ? "Mark unread" : "Mark read"}</ActionButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
