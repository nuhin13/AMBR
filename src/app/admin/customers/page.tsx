import Link from "next/link";
import { requirePermission } from "@/modules/auth/rbac";
import { listCustomers } from "@/modules/customers/admin-queries";
import { formatBDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { formatBDPhone } from "@/lib/phone";
import { PageHeader, Table, Th, Td, EmptyRow, Pagination, FilterBar, FilterInput } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("customers:view");
  const sp = await searchParams;
  const { customers, total, page, pages } = await listCustomers(sp);
  return (
    <>
      <PageHeader title="Customers" description="Registered accounts. Guest buyers appear in Orders (search by phone)." actions={<ButtonLink href="/admin/export/customers" variant="secondary" size="sm" prefetch={false}>Export CSV</ButtonLink>} />
      <FilterBar basePath="/admin/customers"><FilterInput label="Search" name="q" defaultValue={sp.q} placeholder="Name, email or phone" className="flex-1" /></FilterBar>
      <Table>
        <thead><tr><Th>Customer</Th><Th>Contact</Th><Th>Joined</Th><Th align="right">Orders</Th><Th align="right">Spent</Th></tr></thead>
        <tbody>
          {customers.length === 0 && <EmptyRow colSpan={5}>No customers yet.</EmptyRow>}
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-cream-light">
              <Td><Link href={`/admin/customers/${c.id}`} className="font-medium text-burgundy hover:underline">{c.name}</Link>{c.status === "DISABLED" && <Badge tone="error" className="ml-2">Disabled</Badge>}</Td>
              <Td className="text-[12.5px]">{c.email}<div className="text-muted">{c.phone ? formatBDPhone(c.phone) : ""}</div></Td>
              <Td className="text-[12.5px]">{formatDate(c.createdAt)}</Td>
              <Td align="right">{c._count.orders}</Td>
              <Td align="right">{formatBDT(c.spent)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pages={pages} total={total} params={sp} basePath="/admin/customers" />
    </>
  );
}
