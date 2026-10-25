import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { savePageAction } from "@/modules/content/admin-actions";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Input, Textarea } from "@/components/ui/field";

export const metadata = { title: "Edit page" };

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  await requirePermission("content:manage");
  const { slug } = await params;
  const page = await db.contentPage.findUnique({ where: { slug } });
  if (!page) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/content/pages", label: "Pages" }} title={`Edit: ${page.title}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card title="Content">
          <ActionForm action={savePageAction} className="space-y-4" success="Page published">
            <input type="hidden" name="slug" value={page.slug} />
            <Input name="title" label="Title" defaultValue={page.title} required />
            <Textarea name="body" label="Body (HTML)" rows={22} defaultValue={page.body} className="font-mono" hint="Allowed: <p> <h2> <h3> <strong> <em> <ul> <ol> <li> <a href> <blockquote> <hr>. Anything else is removed for safety. Plain text with blank lines also works." />
            <Input name="seoDescription" label="Search description" defaultValue={page.seoDescription ?? ""} maxLength={170} />
            <SubmitButton>Publish changes</SubmitButton>
          </ActionForm>
        </Card>
        <Card title="Current published version">
          <div className="prose-ambr text-[14.5px]" dangerouslySetInnerHTML={{ __html: page.body }} />
        </Card>
      </div>
    </>
  );
}
