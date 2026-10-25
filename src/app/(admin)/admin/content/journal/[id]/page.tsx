import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { deleteArticleAction } from "@/modules/content/admin-actions";
import { translationProps } from "@/modules/translations/admin-queries";
import { localePath } from "@/i18n/config";
import { PageHeader } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/article-form";
import { ActionButton } from "@/components/admin/action-form";
import { LangTabs, TranslationEditor } from "@/components/admin/translation-editor";
import { htmlForEditing } from "@/components/admin/translation-fields";

export const metadata = { title: "Journal article" };

export default async function ArticleEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  await requirePermission("content:manage");
  const { id } = await params;
  const { lang } = await searchParams;
  const isNew = id === "new";
  const a = isNew ? null : await db.article.findUnique({ where: { id } });
  if (!isNew && !a) notFound();
  const tr = a ? await translationProps("article", a.id) : null;
  return (
    <>
      <PageHeader
        back={{ href: "/admin/content/journal", label: "Journal" }}
        title={a ? a.title : "New article"}
        description={a?.status === "PUBLISHED" ? <Link href={localePath("en", `/journal/${a.slug}`)} target="_blank" className="text-burgundy underline">View on site</Link> : a ? "English version is a draft — not visible on the site." : undefined}
        actions={a ? <ActionButton action={deleteArticleAction} fields={{ id: a.id }} variant="ghost" className="text-error" redirectTo="/admin/content/journal" confirm={`Delete “${a.title}” in both languages?`}>Delete</ActionButton> : undefined}
      />
      <LangTabs
        initial={lang === "bn" ? "bn" : "en"}
        bnStatus={tr?.status ?? "MISSING"}
        bnDisabledReason={a ? undefined : "Save the English article first, then add its Bangla version."}
        english={
          <ArticleForm
            initial={
              a
                ? { id: a.id, title: a.title, slug: a.slug, excerpt: a.excerpt, body: htmlForEditing(a.body), coverImage: a.coverImage, coverAlt: a.coverAlt ?? "", authorName: a.authorName ?? "", seoTitle: a.seoTitle ?? "", seoDescription: a.seoDescription ?? "", status: a.status }
                : { title: "", slug: "", excerpt: "", body: "", coverImage: null, coverAlt: "", authorName: "AMBR", seoTitle: "", seoDescription: "", status: "DRAFT" }
            }
          />
        }
        bangla={
          a && tr ? (
            <div className="max-w-3xl border border-beige bg-white p-4 md:p-5">
              <p className="mb-4 text-[13px] text-muted">The cover image and address are shared. Publishing the Bangla version shows it on /bn/journal — it appears there only while the English article is also published.</p>
              <TranslationEditor {...tr} english={{ title: a.title, excerpt: a.excerpt, body: a.body, coverAlt: a.coverAlt, seoTitle: a.seoTitle, seoDescription: a.seoDescription }} />
            </div>
          ) : null
        }
      />
    </>
  );
}
