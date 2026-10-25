import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { deleteFaqAction } from "@/modules/content/admin-actions";
import { PageHeader, Card } from "@/components/admin/ui";
import { FaqEditor } from "@/components/admin/faq-editor";
import { ActionButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "FAQ" };

export default async function FaqAdmin() {
  await requirePermission("content:manage");
  const items = await db.faqItem.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  const groups = [...new Set(items.map((i) => i.category))];
  return (
    <>
      <PageHeader title="FAQ" description="Questions shown on the FAQ page, grouped by topic." actions={<FaqEditor isNew initial={{ question: "", answer: "", category: groups[0] ?? "General", sortOrder: items.length, isActive: true }} />} />
      {groups.map((g) => (
        <Card key={g} title={g} className="mb-6">
          <ul className="divide-y divide-beige">
            {items.filter((i) => i.category === g).map((i) => (
              <li key={i.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{i.question} {!i.isActive && <Badge tone="outline" className="ml-1">Hidden</Badge>}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted">{i.answer}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <FaqEditor initial={{ id: i.id, question: i.question, answer: i.answer, category: i.category, sortOrder: i.sortOrder, isActive: i.isActive }} />
                  <ActionButton action={deleteFaqAction} fields={{ id: i.id }} variant="ghost" className="text-error" confirm="Delete this question?">Delete</ActionButton>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </>
  );
}
