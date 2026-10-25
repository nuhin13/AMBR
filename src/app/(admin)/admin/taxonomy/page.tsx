import { requirePermission } from "@/modules/auth/rbac";
import { taxonomyAdmin } from "@/modules/catalog/admin-queries";
import { PageHeader, Card } from "@/components/admin/ui";
import { TaxonomyRow } from "@/components/admin/taxonomy-row";

export const metadata = { title: "Families, notes & occasions" };

export default async function TaxonomyPage() {
  await requirePermission("catalog:manage");
  const { families, occasions, notes } = await taxonomyAdmin();
  return (
    <>
      <PageHeader title="Families, notes & occasions" description="These power the Find Your Fragrance explorer and shop filters. Notes are also created automatically when you type them on a product. Add a Bangla name to each — the /bn site falls back to English where it is missing." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Fragrance families">
          <ul>
            {families.map((f) => <TaxonomyRow key={f.id} kind="family" id={f.id} name={f.name} nameBn={f.nameBn} description={f.description} descriptionBn={f.descriptionBn} sortOrder={f.sortOrder} count={f._count.products} />)}
            <TaxonomyRow kind="family" name="" sortOrder={families.length} />
          </ul>
        </Card>
        <Card title="Occasions">
          <ul>
            {occasions.map((o) => <TaxonomyRow key={o.id} kind="occasion" id={o.id} name={o.name} nameBn={o.nameBn} sortOrder={o.sortOrder} count={o._count.products} />)}
            <TaxonomyRow kind="occasion" name="" sortOrder={occasions.length} />
          </ul>
        </Card>
        <Card title={`Notes (${notes.length})`} className="xl:col-span-2">
          <ul className="grid gap-x-6 md:grid-cols-2">
            {notes.map((n) => <TaxonomyRow key={n.id} kind="note" id={n.id} name={n.name} nameBn={n.nameBn} count={n._count.products} />)}
            <TaxonomyRow kind="note" name="" />
          </ul>
        </Card>
      </div>
    </>
  );
}
