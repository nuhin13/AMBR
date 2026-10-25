import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, Table, Th, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Pages & policies" };

const PATHS: Record<string, string> = { about: "/about", "shipping-policy": "/policies/shipping", "return-policy": "/policies/returns", "privacy-policy": "/policies/privacy", terms: "/policies/terms", "fragrance-guide": "/fragrance-guide" };

export default async function PagesAdmin() {
  await requirePermission("content:manage");
  const pages = await db.contentPage.findMany({ orderBy: { slug: "asc" } });
  return (
    <>
      <PageHeader title="Pages & policies" description="The About page and policies were drafted as a starting point. Review every policy with your own terms (return window, delivery times, refund method) before launch — payment gateways check them." />
      <Table>
        <thead><tr><Th>Page</Th><Th>Address</Th><Th>Last edited</Th><Th /></tr></thead>
        <tbody>
          {pages.map((p) => {
            const untouched = p.updatedAt.getTime() - p.createdAt.getTime() < 2000;
            return (
              <tr key={p.id} className="hover:bg-cream-light">
                <Td><Link href={`/admin/content/pages/${p.slug}`} className="font-medium text-burgundy hover:underline">{p.title}</Link></Td>
                <Td className="text-[12.5px]"><Link href={PATHS[p.slug] ?? `/${p.slug}`} target="_blank" className="text-muted underline">{PATHS[p.slug] ?? `/${p.slug}`}</Link></Td>
                <Td className="text-[12.5px]">{untouched ? <Badge tone="gold">Draft — needs review</Badge> : formatDateTime(p.updatedAt)}</Td>
                <Td align="right"><Link href={`/admin/content/pages/${p.slug}`} className="text-[12px] uppercase tracking-[0.14em] text-burgundy underline underline-offset-4">Edit</Link></Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
