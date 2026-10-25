import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { savePageAction } from "@/modules/content/admin-actions";
import { translationProps } from "@/modules/translations/admin-queries";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { LangTabs, TranslationEditor } from "@/components/admin/translation-editor";
import { Input, Textarea } from "@/components/ui/field";

export const metadata = { title: "Edit page" };

export default async function EditPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  await requirePermission("content:manage");
  const { slug } = await params;
  const { lang } = await searchParams;
  const page = await db.contentPage.findUnique({ where: { slug } });
  if (!page) notFound();
  const tr = await translationProps("page", page.id);
  return (
    <>
      <PageHeader back={{ href: "/admin/content/pages", label: "Pages" }} title={`Edit: ${page.title}`} />
      <LangTabs
        initial={lang === "bn" ? "bn" : "en"}
        bnStatus={tr.status}
        english={
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card title="English content">
              <ActionForm action={savePageAction} className="space-y-4" success="Page published">
                <input type="hidden" name="slug" value={page.slug} />
                <Input name="title" label="Title" defaultValue={page.title} required />
                <Textarea name="body" label="Body (HTML)" rows={22} defaultValue={page.body} className="font-mono" hint="Allowed: <p> <h2> <h3> <strong> <em> <ul> <ol> <li> <a href> <blockquote> <hr>. Anything else is removed for safety. Plain text with blank lines also works." />
                <Input name="seoDescription" label="Search description" defaultValue={page.seoDescription ?? ""} maxLength={170} />
                <SubmitButton>Publish changes</SubmitButton>
              </ActionForm>
            </Card>
            <Card title="Current published English version">
              <div className="prose-ambr text-[14.5px]" dangerouslySetInnerHTML={{ __html: page.body }} />
            </Card>
          </div>
        }
        bangla={
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card title="Bangla content">
              <TranslationEditor {...tr} english={{ title: page.title, body: page.body, seoDescription: page.seoDescription }} />
            </Card>
            <Card title={tr.status === "PUBLISHED" ? "Current published Bangla version" : "Bangla preview (not published)"}>
              {tr.values.body ? <div lang="bn" className="prose-ambr text-[14.5px]" style={{ fontFamily: "var(--font-sans-bn), sans-serif", lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: tr.values.body }} /> : <p className="text-[13px] text-muted">No Bangla version yet — the /bn page shows the English text.</p>}
            </Card>
          </div>
        }
      />
    </>
  );
}
