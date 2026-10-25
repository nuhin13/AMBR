import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { trStatus } from "@/modules/translations/admin-queries";
import { formatDate } from "@/lib/utils";
import { PageHeader, Table, Th, Td, EmptyRow } from "@/components/admin/ui";
import { TranslationBadge } from "@/components/admin/translation-editor";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Journal" };

export default async function JournalAdmin() {
  await requirePermission("content:manage");
  const articles = await db.article.findMany({ orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }], include: { translations: { where: { locale: "bn" }, select: { status: true } } } });
  return (
    <>
      <PageHeader
        title="Journal"
        description="Guides and stories for the /journal section. Each article has an English version and a Bangla version, published independently."
        actions={<ButtonLink href="/admin/content/journal/new" size="sm">New article</ButtonLink>}
      />
      <Table>
        <thead><tr><Th>Article</Th><Th>English</Th><Th>বাংলা</Th><Th>Published</Th></tr></thead>
        <tbody>
          {articles.length === 0 && <EmptyRow colSpan={4}>No articles yet.</EmptyRow>}
          {articles.map((a) => (
            <tr key={a.id} className="hover:bg-cream-light">
              <Td>
                <Link href={`/admin/content/journal/${a.id}`} className="font-medium text-burgundy hover:underline">{a.title}</Link>
                <div className="text-[11.5px] text-muted">/journal/{a.slug}</div>
              </Td>
              <Td><Badge tone={a.status === "PUBLISHED" ? "success" : "gold"}>{a.status === "PUBLISHED" ? "Published" : "Draft"}</Badge></Td>
              <Td><TranslationBadge status={trStatus(a.translations[0])} /></Td>
              <Td className="text-[12.5px]">{a.publishedAt ? formatDate(a.publishedAt) : "—"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
