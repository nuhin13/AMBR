import Link from "next/link";
import { requirePermission } from "@/modules/auth/rbac";
import { listCollectionsAdmin } from "@/modules/catalog/admin-queries";
import { PageHeader, Table, Th, Td, EmptyRow } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TranslationBadge } from "@/components/admin/translation-editor";
import { trStatus } from "@/modules/translations/admin-queries";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  await requirePermission("catalog:manage");
  const rows = await listCollectionsAdmin();
  return (
    <>
      <PageHeader title="Collections" description="Curated groups such as Office, Evening or Gifts Under ৳1,000. Featured collections appear on the homepage." actions={<ButtonLink href="/admin/collections/new" size="sm">New collection</ButtonLink>} />
      <Table>
        <thead><tr><Th>Collection</Th><Th align="right">Products</Th><Th>Status</Th><Th>Homepage</Th><Th>বাংলা</Th></tr></thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={5}>No collections yet.</EmptyRow>}
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-cream-light">
              <Td><Link href={`/admin/collections/${c.id}`} className="font-medium text-burgundy hover:underline">{c.name}</Link><div className="text-[11.5px] text-muted">/collections/{c.slug}</div></Td>
              <Td align="right">{c._count.products}</Td>
              <Td><Badge tone={c.status === "PUBLISHED" ? "success" : "outline"}>{c.status.toLowerCase()}</Badge></Td>
              <Td>{c.isFeatured ? <Badge tone="beige">Featured</Badge> : <span className="text-muted">—</span>}</Td>
              <Td><TranslationBadge status={trStatus(c.translations[0])} /></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
